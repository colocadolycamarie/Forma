import { and, eq, gte, sql } from "drizzle-orm";
import type { AthleteHome, HeatmapDay } from "@forma/shared";
import { db } from "../db/client.js";
import { loggedSetsTable, workoutSessionsTable } from "../db/schema.js";
import { getTodaySessionDetail } from "./workout.service.js";
import type { User } from "../db/schema.js";

const HEATMAP_DAYS = 35;
const WEEKLY_SESSION_TARGET = 4;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function computeStreakDays(userId: string): Promise<number> {
  const completedDays = await db
    .select({ day: sql<string>`date_trunc('day', ${workoutSessionsTable.completedAt})` })
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.userId, userId), eq(workoutSessionsTable.status, "completed")))
    .groupBy(sql`date_trunc('day', ${workoutSessionsTable.completedAt})`);

  const daySet = new Set(completedDays.map((row) => row.day.slice(0, 10)));
  if (daySet.size === 0) return 0;

  let streak = 0;
  const cursor = startOfDay(new Date());
  // Allow today to be "in progress" without breaking the streak.
  if (!daySet.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function computeVolumeSince(userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${loggedSetsTable.weight} * ${loggedSetsTable.reps}), 0)` })
    .from(loggedSetsTable)
    .innerJoin(workoutSessionsTable, eq(workoutSessionsTable.id, loggedSetsTable.sessionId))
    .where(and(eq(workoutSessionsTable.userId, userId), gte(loggedSetsTable.createdAt, since)));
  return Number(row?.total ?? 0);
}

export async function computeAdherencePercent(userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(distinct date_trunc('day', ${workoutSessionsTable.completedAt}))` })
    .from(workoutSessionsTable)
    .where(and(eq(workoutSessionsTable.userId, userId), eq(workoutSessionsTable.status, "completed"), gte(workoutSessionsTable.completedAt, since)));
  const completedDays = Number(row?.count ?? 0);
  return Math.min(100, Math.round((completedDays / WEEKLY_SESSION_TARGET) * 100));
}

async function computeHeatmap(userId: string): Promise<HeatmapDay[]> {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (HEATMAP_DAYS - 1));

  const rows = await db
    .select({
      day: sql<string>`date_trunc('day', ${loggedSetsTable.createdAt})`,
      setsLogged: sql<number>`count(*)`,
    })
    .from(loggedSetsTable)
    .innerJoin(workoutSessionsTable, eq(workoutSessionsTable.id, loggedSetsTable.sessionId))
    .where(and(eq(workoutSessionsTable.userId, userId), gte(loggedSetsTable.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${loggedSetsTable.createdAt})`);

  const countsByDay = new Map(rows.map((row) => [row.day.slice(0, 10), Number(row.setsLogged)]));
  const maxCount = Math.max(0, ...Array.from(countsByDay.values()));

  const days: HeatmapDay[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < HEATMAP_DAYS; i += 1) {
    const key = dateKey(cursor);
    const setsLogged = countsByDay.get(key) ?? 0;
    const level = maxCount === 0 || setsLogged === 0 ? 0 : Math.min(4, Math.ceil((setsLogged / maxCount) * 4));
    days.push({ date: key, setsLogged, level });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function buildInsight(thisWeekVolume: number, lastWeekVolume: number): string {
  if (thisWeekVolume === 0 && lastWeekVolume === 0) {
    return "Log your first set today and this space will start tracking your trends.";
  }
  if (lastWeekVolume === 0) {
    return "First full week on the books — keep the streak going.";
  }
  const changePercent = Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100);
  if (changePercent > 0) {
    return `Your volume is up ${changePercent}% versus last week. Keep the same controlled tempo and let the work compound.`;
  }
  if (changePercent < 0) {
    return `Volume is down ${Math.abs(changePercent)}% versus last week — a lighter week is fine if it's planned recovery.`;
  }
  return "Your volume is holding steady week over week. Consistency is the whole game.";
}

export async function getAthleteHome(user: User): Promise<AthleteHome> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const [today, streakDays, weeklyVolume, previousWeekVolume, adherencePercent, heatmap] = await Promise.all([
    getTodaySessionDetail(user.id),
    computeStreakDays(user.id),
    computeVolumeSince(user.id, sevenDaysAgo),
    computeVolumeSince(user.id, fourteenDaysAgo).then(async (fourteenDayTotal) => {
      const last7 = await computeVolumeSince(user.id, sevenDaysAgo);
      return Math.max(0, fourteenDayTotal - last7);
    }),
    computeAdherencePercent(user.id, sevenDaysAgo),
    computeHeatmap(user.id),
  ]);

  if (!today) {
    throw new Error("Expected today's session to exist for this athlete.");
  }

  // Exercise `muscleGroup` values can themselves be compound (e.g. "Chest · Triceps"),
  // so split on the same separator before deduping — otherwise "Chest" and "Triceps"
  // can each appear twice in the summary.
  const muscleGroups = Array.from(
    new Set(
      today.exercises.flatMap((exercise) => exercise.muscleGroup.split("·").map((part) => part.trim())).filter(Boolean),
    ),
  );

  return {
    displayName: user.displayName,
    greeting: `${greetingForHour(now.getHours())}, ${user.displayName.split(" ")[0]}`,
    streakDays,
    weeklyVolume: Math.round(weeklyVolume),
    volumeUnit: "kg",
    adherencePercent,
    heatmap,
    today: {
      id: today.id,
      title: today.title,
      subtitle: muscleGroups.join(" · ") || "Rest or recovery",
      status: today.status,
      exerciseCount: today.exercises.length,
      startedAt: today.startedAt,
      completedAt: today.completedAt,
    },
    insight: buildInsight(weeklyVolume, previousWeekVolume),
  };
}

/**
 * Lightweight per-athlete stats for a coach's roster — deliberately does
 * NOT call getTodaySessionDetail, since that has a side effect of creating
 * "today's session" for the athlete. A coach viewing their roster should
 * never silently generate training data on an athlete's behalf.
 */
export async function getAthleteSummary(userId: string): Promise<{ streakDays: number; weeklyVolume: number; adherencePercent: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [streakDays, weeklyVolume, adherencePercent] = await Promise.all([
    computeStreakDays(userId),
    computeVolumeSince(userId, sevenDaysAgo),
    computeAdherencePercent(userId, sevenDaysAgo),
  ]);

  return { streakDays, weeklyVolume: Math.round(weeklyVolume), adherencePercent };
}
