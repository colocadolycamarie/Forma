import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import type { ExerciseHistory, SessionExercise, WorkoutSessionDetail, WorkoutSessionStatus } from "@forma/shared";
import { db } from "../db/client.js";
import { exercisesTable, loggedSetsTable, sessionExercisesTable, workoutSessionsTable } from "../db/schema.js";

const DEFAULT_EXERCISE_COUNT = 4;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildSessionTitle(muscleGroups: string[]): string {
  const primary = Array.from(
    new Set(muscleGroups.map((group) => group.split("·")[0]?.trim()).filter((value): value is string => Boolean(value))),
  ).slice(0, 2);
  return primary.length > 0 ? `${primary.join(" & ")} session` : "Training session";
}

/** Chooses exercises for a freshly created session: repeats the athlete's
 * most recent program if one exists, otherwise starts from the top of
 * the shared catalog. */
async function pickExercisesForNewSession(userId: string) {
  const [previousSession] = await db
    .select({ id: workoutSessionsTable.id })
    .from(workoutSessionsTable)
    .where(eq(workoutSessionsTable.userId, userId))
    .orderBy(desc(workoutSessionsTable.createdAt))
    .limit(1);

  if (previousSession) {
    const previousExercises = await db
      .select({ exerciseId: sessionExercisesTable.exerciseId, targetSets: sessionExercisesTable.targetSets })
      .from(sessionExercisesTable)
      .where(eq(sessionExercisesTable.sessionId, previousSession.id))
      .orderBy(asc(sessionExercisesTable.orderIndex));

    if (previousExercises.length > 0) {
      const exerciseRows = await db.select().from(exercisesTable);
      const byId = new Map(exerciseRows.map((row) => [row.id, row]));
      return previousExercises
        .map((item) => {
          const exercise = byId.get(item.exerciseId);
          return exercise ? { ...exercise, defaultTargetSets: item.targetSets } : null;
        })
        .filter((value): value is NonNullable<typeof value> => value !== null);
    }
  }

  return db.select().from(exercisesTable).orderBy(asc(exercisesTable.sortOrder)).limit(DEFAULT_EXERCISE_COUNT);
}

async function getOrCreateTodaySession(userId: string) {
  const today = startOfDay(new Date());

  const [existing] = await db
    .select()
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.userId, userId), gte(workoutSessionsTable.createdAt, today)))
    .orderBy(desc(workoutSessionsTable.createdAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  const exercises = await pickExercisesForNewSession(userId);
  const sessionId = randomUUID();

  await db.insert(workoutSessionsTable).values({
    id: sessionId,
    userId,
    title: buildSessionTitle(exercises.map((exercise) => exercise.muscleGroup)),
    status: "planned",
  });

  if (exercises.length > 0) {
    await db.insert(sessionExercisesTable).values(
      exercises.map((exercise, index) => ({
        id: randomUUID(),
        sessionId,
        exerciseId: exercise.id,
        orderIndex: index,
        targetSets: exercise.defaultTargetSets,
      })),
    );
  }

  const [created] = await db.select().from(workoutSessionsTable).where(eq(workoutSessionsTable.id, sessionId)).limit(1);
  return created;
}

async function lastPerformanceFor(userId: string, exerciseId: string, beforeSessionId: string) {
  const [row] = await db
    .select({ weight: loggedSetsTable.weight, reps: loggedSetsTable.reps })
    .from(loggedSetsTable)
    .innerJoin(workoutSessionsTable, eq(workoutSessionsTable.id, loggedSetsTable.sessionId))
    .where(
      and(
        eq(workoutSessionsTable.userId, userId),
        eq(loggedSetsTable.exerciseId, exerciseId),
        sql`${loggedSetsTable.sessionId} != ${beforeSessionId}`,
      ),
    )
    .orderBy(desc(loggedSetsTable.createdAt))
    .limit(1);
  return row ?? null;
}

export async function loadSessionDetail(userId: string, sessionId: string): Promise<WorkoutSessionDetail | null> {
  const [session] = await db
    .select()
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.id, sessionId), eq(workoutSessionsTable.userId, userId)))
    .limit(1);

  if (!session) return null;

  const [assignments, sets] = await Promise.all([
    db
      .select({
        id: sessionExercisesTable.id,
        exerciseId: sessionExercisesTable.exerciseId,
        orderIndex: sessionExercisesTable.orderIndex,
        targetSets: sessionExercisesTable.targetSets,
        name: exercisesTable.name,
        muscleGroup: exercisesTable.muscleGroup,
        repRangeLabel: exercisesTable.repRangeLabel,
      })
      .from(sessionExercisesTable)
      .innerJoin(exercisesTable, eq(exercisesTable.id, sessionExercisesTable.exerciseId))
      .where(eq(sessionExercisesTable.sessionId, sessionId))
      .orderBy(asc(sessionExercisesTable.orderIndex)),
    db
      .select()
      .from(loggedSetsTable)
      .where(eq(loggedSetsTable.sessionId, sessionId))
      .orderBy(desc(loggedSetsTable.createdAt)),
  ]);

  const exercises: SessionExercise[] = await Promise.all(
    assignments.map(async (assignment) => {
      const setsForExercise = sets.filter((set) => set.exerciseId === assignment.exerciseId);
      const last = await lastPerformanceFor(userId, assignment.exerciseId, sessionId);
      return {
        id: assignment.exerciseId,
        exerciseId: assignment.exerciseId,
        name: assignment.name,
        muscleGroup: assignment.muscleGroup,
        repRangeLabel: assignment.repRangeLabel,
        orderIndex: assignment.orderIndex,
        targetSets: assignment.targetSets,
        suggestedWeight: last?.weight ?? null,
        suggestedReps: last?.reps ?? null,
        lastPerformanceLabel: last ? `${last.weight} kg × ${last.reps}` : null,
        setsCompleted: setsForExercise.length,
      };
    }),
  );

  return {
    id: session.id,
    title: session.title,
    status: session.status as WorkoutSessionStatus,
    startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    completedAt: session.completedAt ? session.completedAt.toISOString() : null,
    exercises,
    recentSets: sets.map((set) => ({
      id: set.id,
      sessionId: set.sessionId,
      exerciseId: set.exerciseId,
      exerciseName: exercises.find((exercise) => exercise.exerciseId === set.exerciseId)?.name ?? "Exercise",
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      isPr: set.isPr,
      createdAt: set.createdAt.toISOString(),
    })),
  };
}

export async function getTodaySessionDetail(userId: string): Promise<WorkoutSessionDetail | null> {
  const session = await getOrCreateTodaySession(userId);
  return loadSessionDetail(userId, session.id);
}

export async function startSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail | null> {
  const [session] = await db
    .select()
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.id, sessionId), eq(workoutSessionsTable.userId, userId)))
    .limit(1);
  if (!session) return null;

  if (session.status === "planned") {
    await db
      .update(workoutSessionsTable)
      .set({ status: "in_progress", startedAt: new Date() })
      .where(eq(workoutSessionsTable.id, sessionId));
  }

  return loadSessionDetail(userId, sessionId);
}

export async function completeSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail | null> {
  const [session] = await db
    .select()
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.id, sessionId), eq(workoutSessionsTable.userId, userId)))
    .limit(1);
  if (!session) return null;

  await db
    .update(workoutSessionsTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(workoutSessionsTable.id, sessionId));

  return loadSessionDetail(userId, sessionId);
}

export async function logSet(
  userId: string,
  sessionId: string,
  input: { exerciseId: string; setNumber: number; weight: number; reps: number; rpe?: number | null },
) {
  const [session] = await db
    .select()
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.id, sessionId), eq(workoutSessionsTable.userId, userId)))
    .limit(1);
  if (!session) return null;

  const [bestPrevious] = await db
    .select({ weight: loggedSetsTable.weight })
    .from(loggedSetsTable)
    .innerJoin(workoutSessionsTable, eq(workoutSessionsTable.id, loggedSetsTable.sessionId))
    .where(and(eq(workoutSessionsTable.userId, userId), eq(loggedSetsTable.exerciseId, input.exerciseId)))
    .orderBy(desc(loggedSetsTable.weight))
    .limit(1);

  const isPr = !bestPrevious || input.weight > bestPrevious.weight;

  const id = randomUUID();
  await db.insert(loggedSetsTable).values({
    id,
    sessionId,
    exerciseId: input.exerciseId,
    setNumber: input.setNumber,
    weight: input.weight,
    reps: input.reps,
    rpe: input.rpe ?? null,
    isPr,
  });

  if (session.status === "planned") {
    await db
      .update(workoutSessionsTable)
      .set({ status: "in_progress", startedAt: session.startedAt ?? new Date() })
      .where(eq(workoutSessionsTable.id, sessionId));
  }

  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, input.exerciseId)).limit(1);
  const [row] = await db.select().from(loggedSetsTable).where(eq(loggedSetsTable.id, id)).limit(1);

  return {
    id: row.id,
    sessionId: row.sessionId,
    exerciseId: row.exerciseId,
    exerciseName: exercise?.name ?? "Exercise",
    setNumber: row.setNumber,
    weight: row.weight,
    reps: row.reps,
    rpe: row.rpe,
    isPr: row.isPr,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getExerciseHistory(userId: string, exerciseId: string): Promise<ExerciseHistory | null> {
  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, exerciseId)).limit(1);
  if (!exercise) return null;

  const sets = await db
    .select({
      weight: loggedSetsTable.weight,
      reps: loggedSetsTable.reps,
      createdAt: loggedSetsTable.createdAt,
    })
    .from(loggedSetsTable)
    .innerJoin(workoutSessionsTable, eq(workoutSessionsTable.id, loggedSetsTable.sessionId))
    .where(and(eq(workoutSessionsTable.userId, userId), eq(loggedSetsTable.exerciseId, exerciseId)))
    .orderBy(asc(loggedSetsTable.createdAt));

  const points = sets.slice(-8).map((set) => ({
    date: set.createdAt.toISOString().slice(0, 10),
    weight: set.weight,
    estimatedOneRepMax: Math.round(set.weight * (1 + set.reps / 30) * 10) / 10,
  }));

  const bestWeight = sets.length > 0 ? Math.max(...sets.map((set) => set.weight)) : null;
  const bestEstimatedOneRepMax = points.length > 0 ? Math.max(...points.map((point) => point.estimatedOneRepMax)) : null;

  return {
    exerciseId,
    exerciseName: exercise.name,
    bestWeight,
    bestEstimatedOneRepMax,
    points,
  };
}
