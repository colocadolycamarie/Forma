/**
 * Populates the shared exercise catalog. This is reference data every
 * athlete's training programs are built from — analogous to seeding a
 * product catalog — not per-user demo content. Safe to re-run: existing
 * rows are left untouched and only missing ones are inserted.
 */
import { randomUUID } from "node:crypto";
import { db, pool } from "./client.js";
import { exercisesTable } from "./schema.js";

const catalog: Array<{ name: string; muscleGroup: string; repRangeLabel: string; defaultTargetSets: number }> = [
  { name: "Barbell Bench Press", muscleGroup: "Chest · Triceps", repRangeLabel: "6–8", defaultTargetSets: 4 },
  { name: "Incline Dumbbell Press", muscleGroup: "Upper chest", repRangeLabel: "8–10", defaultTargetSets: 3 },
  { name: "Low Cable Fly", muscleGroup: "Chest", repRangeLabel: "12–15", defaultTargetSets: 3 },
  { name: "Rope Tricep Pushdown", muscleGroup: "Triceps", repRangeLabel: "10–12", defaultTargetSets: 3 },
  { name: "Barbell Back Squat", muscleGroup: "Quads · Glutes", repRangeLabel: "5–8", defaultTargetSets: 4 },
  { name: "Romanian Deadlift", muscleGroup: "Hamstrings · Glutes", repRangeLabel: "8–10", defaultTargetSets: 3 },
  { name: "Walking Lunge", muscleGroup: "Quads · Glutes", repRangeLabel: "10–12", defaultTargetSets: 3 },
  { name: "Barbell Row", muscleGroup: "Back · Biceps", repRangeLabel: "6–8", defaultTargetSets: 4 },
  { name: "Lat Pulldown", muscleGroup: "Back", repRangeLabel: "10–12", defaultTargetSets: 3 },
  { name: "Seated Cable Row", muscleGroup: "Back", repRangeLabel: "10–12", defaultTargetSets: 3 },
  { name: "Standing Overhead Press", muscleGroup: "Shoulders", repRangeLabel: "6–8", defaultTargetSets: 4 },
  { name: "Barbell Curl", muscleGroup: "Biceps", repRangeLabel: "10–12", defaultTargetSets: 3 },
];

async function seed() {
  const existing = await db.select({ name: exercisesTable.name }).from(exercisesTable);
  const existingNames = new Set(existing.map((row) => row.name));
  const missing = catalog.filter((item) => !existingNames.has(item.name));

  if (missing.length === 0) {
    console.log("Exercise catalog already seeded — nothing to do.");
    return;
  }

  await db.insert(exercisesTable).values(
    missing.map((item, index) => ({
      id: randomUUID(),
      ...item,
      sortOrder: existingNames.size + index,
    })),
  );

  console.log(`Seeded ${missing.length} exercise(s) into the catalog.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
