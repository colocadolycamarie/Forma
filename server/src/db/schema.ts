import { boolean, integer, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Registered users. Passwords are stored as bcrypt hashes only — the
 * plaintext password never reaches the database. `role` determines whether
 * someone sees the athlete training log or the coach roster.
 *
 * `coachCode` is a short, shareable code generated only for coach accounts
 * (an athlete enters it once to link themselves to that coach's roster).
 * It is NOT a secret credential — it grants no access by itself beyond
 * "add yourself to this coach's roster" — so a plain unique text code is an
 * appropriate, low-friction invite mechanism without needing email
 * delivery infrastructure.
 */
export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("athlete"), // athlete | coach
    coachCode: text("coach_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    coachCodeIdx: uniqueIndex("users_coach_code_idx").on(table.coachCode),
  }),
);

/** A coach ↔ athlete relationship, created when an athlete enters a coach's code. */
export const coachLinksTable = pgTable(
  "coach_links",
  {
    id: text("id").primaryKey(),
    coachId: text("coach_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    athleteId: text("athlete_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    linkIdx: uniqueIndex("coach_links_coach_athlete_idx").on(table.coachId, table.athleteId),
  }),
);

/**
 * The exercise catalog. Shared across all athletes — this is reference
 * data (like a product catalog), not per-user mock data, and is
 * populated once via `npm run db:seed`.
 */
export const exercisesTable = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  repRangeLabel: text("rep_range_label").notNull(),
  defaultTargetSets: integer("default_target_sets").notNull().default(3),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const workoutSessionsTable = pgTable("workout_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("planned"), // planned | in_progress | completed
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** The exercises assigned to a given session, in display order. */
export const sessionExercisesTable = pgTable("session_exercises", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessionsTable.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercisesTable.id),
  orderIndex: integer("order_index").notNull().default(0),
  targetSets: integer("target_sets").notNull().default(3),
});

export const loggedSetsTable = pgTable("logged_sets", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessionsTable.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercisesTable.id),
  setNumber: integer("set_number").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  rpe: real("rpe"),
  isPr: boolean("is_pr").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type CoachLinkRow = typeof coachLinksTable.$inferSelect;
export type ExerciseRow = typeof exercisesTable.$inferSelect;
export type WorkoutSession = typeof workoutSessionsTable.$inferSelect;
export type SessionExerciseRow = typeof sessionExercisesTable.$inferSelect;
export type LoggedSetRow = typeof loggedSetsTable.$inferSelect;
