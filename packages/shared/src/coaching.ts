import { z } from "zod";

export const coachCodeSchema = z.object({
  code: z.string(),
});
export type CoachCode = z.infer<typeof coachCodeSchema>;

export const linkCoachInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Enter a coach code"),
});
export type LinkCoachInput = z.infer<typeof linkCoachInputSchema>;

export const rosterAthleteSchema = z.object({
  linkId: z.string(),
  athleteId: z.string(),
  displayName: z.string(),
  email: z.string(),
  streakDays: z.number().int(),
  weeklyVolume: z.number(),
  adherencePercent: z.number().int(),
  linkedAt: z.string(),
});
export type RosterAthlete = z.infer<typeof rosterAthleteSchema>;

export const linkedCoachSchema = z.object({
  linkId: z.string(),
  coachId: z.string(),
  displayName: z.string(),
  email: z.string(),
  linkedAt: z.string(),
});
export type LinkedCoach = z.infer<typeof linkedCoachSchema>;
