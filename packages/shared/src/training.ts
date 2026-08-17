import { z } from "zod";

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: z.string(),
  repRangeLabel: z.string(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const sessionExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  name: z.string(),
  muscleGroup: z.string(),
  repRangeLabel: z.string(),
  orderIndex: z.number().int(),
  targetSets: z.number().int(),
  suggestedWeight: z.number().nullable(),
  suggestedReps: z.number().int().nullable(),
  lastPerformanceLabel: z.string().nullable(),
  setsCompleted: z.number().int(),
});
export type SessionExercise = z.infer<typeof sessionExerciseSchema>;

export const loggedSetSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  setNumber: z.number().int(),
  weight: z.number(),
  reps: z.number().int(),
  rpe: z.number().nullable(),
  isPr: z.boolean(),
  createdAt: z.string(),
});
export type LoggedSet = z.infer<typeof loggedSetSchema>;

export const workoutSessionStatusSchema = z.enum(["planned", "in_progress", "completed"]);
export type WorkoutSessionStatus = z.infer<typeof workoutSessionStatusSchema>;

export const workoutSessionDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: workoutSessionStatusSchema,
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  exercises: z.array(sessionExerciseSchema),
  recentSets: z.array(loggedSetSchema),
});
export type WorkoutSessionDetail = z.infer<typeof workoutSessionDetailSchema>;

export const logSetInputSchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  weight: z.number().positive(),
  reps: z.number().int().positive(),
  rpe: z.number().min(1).max(10).nullable().optional(),
});
export type LogSetInput = z.infer<typeof logSetInputSchema>;

export const heatmapDaySchema = z.object({
  date: z.string(),
  setsLogged: z.number().int(),
  level: z.number().int().min(0).max(4),
});
export type HeatmapDay = z.infer<typeof heatmapDaySchema>;

export const athleteHomeSchema = z.object({
  displayName: z.string(),
  greeting: z.string(),
  streakDays: z.number().int(),
  weeklyVolume: z.number(),
  volumeUnit: z.literal("kg"),
  adherencePercent: z.number().int(),
  heatmap: z.array(heatmapDaySchema),
  today: z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    status: workoutSessionStatusSchema,
    exerciseCount: z.number().int(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
  }),
  insight: z.string(),
});
export type AthleteHome = z.infer<typeof athleteHomeSchema>;

export const exerciseHistoryPointSchema = z.object({
  date: z.string(),
  weight: z.number(),
  estimatedOneRepMax: z.number(),
});
export type ExerciseHistoryPoint = z.infer<typeof exerciseHistoryPointSchema>;

export const exerciseHistorySchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  bestWeight: z.number().nullable(),
  bestEstimatedOneRepMax: z.number().nullable(),
  points: z.array(exerciseHistoryPointSchema),
});
export type ExerciseHistory = z.infer<typeof exerciseHistorySchema>;
