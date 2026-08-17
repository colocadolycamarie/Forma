/**
 * Integration tests that exercise the real Express app against a real
 * Postgres database (whatever DATABASE_URL in your environment points
 * to — see README "Run the tests"). These are not mocked: signup
 * actually hashes a password and writes a row, logging a set actually
 * queries prior sets to determine PR status, and so on.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { pool } from "./db/client.js";
import { exercisesTable } from "./db/schema.js";
import { db } from "./db/client.js";
import { randomUUID } from "node:crypto";

const app = createApp();

async function resetDatabase() {
  await pool.query('TRUNCATE TABLE logged_sets, session_exercises, workout_sessions, exercises, users RESTART IDENTITY CASCADE');
  await db.insert(exercisesTable).values([
    { id: randomUUID(), name: "Barbell Bench Press", muscleGroup: "Chest · Triceps", repRangeLabel: "6–8", defaultTargetSets: 4, sortOrder: 0 },
    { id: randomUUID(), name: "Incline Dumbbell Press", muscleGroup: "Upper chest", repRangeLabel: "8–10", defaultTargetSets: 3, sortOrder: 1 },
  ]);
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

async function signUp(agent: ReturnType<typeof request.agent>, email = "athlete@example.com") {
  const response = await agent
    .post("/api/auth/signup")
    .send({ email, password: "correcthorsebattery", displayName: "Test Athlete" });
  expect(response.status).toBe(201);
  return response.body;
}

describe("auth", () => {
  it("rejects an invalid signup payload", async () => {
    const response = await request(app).post("/api/auth/signup").send({ email: "not-an-email", password: "x", displayName: "" });
    expect(response.status).toBe(400);
  });

  it("signs up, persists a session, and exposes the user via /me", async () => {
    const agent = request.agent(app);
    const user = await signUp(agent);
    expect(user.email).toBe("athlete@example.com");
    expect(user).not.toHaveProperty("passwordHash");

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(user.id);
  });

  it("rejects a duplicate email", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const again = await request(app)
      .post("/api/auth/signup")
      .send({ email: "athlete@example.com", password: "correcthorsebattery", displayName: "Someone Else" });
    expect(again.status).toBe(409);
  });

  it("rejects a wrong password on login", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const attempt = await request(app).post("/api/auth/login").send({ email: "athlete@example.com", password: "wrong-password" });
    expect(attempt.status).toBe(401);
  });

  it("blocks protected routes without a session", async () => {
    const response = await request(app).get("/api/sessions/today");
    expect(response.status).toBe(401);
  });

  it("invalidates the session on logout", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(204);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });
});

describe("workout flow", () => {
  it("auto-creates today's session from the exercise catalog for a new athlete", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const response = await agent.get("/api/sessions/today");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("planned");
    expect(response.body.exercises.length).toBeGreaterThan(0);
    // Every athlete starts with no history — suggestions must be honestly null, not fabricated.
    expect(response.body.exercises[0].suggestedWeight).toBeNull();
    expect(response.body.exercises[0].lastPerformanceLabel).toBeNull();
  });

  it("logs sets, correctly flags PRs, and completes the session", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const today = await agent.get("/api/sessions/today");
    const sessionId = today.body.id;
    const exerciseId = today.body.exercises[0].exerciseId;

    await agent.post(`/api/sessions/${sessionId}/start`);

    const set1 = await agent.post(`/api/sessions/${sessionId}/sets`).send({ exerciseId, setNumber: 1, weight: 60, reps: 8, rpe: 7 });
    expect(set1.body.isPr).toBe(true);

    const set2 = await agent.post(`/api/sessions/${sessionId}/sets`).send({ exerciseId, setNumber: 2, weight: 65, reps: 6, rpe: 8 });
    expect(set2.body.isPr).toBe(true);

    const set3 = await agent.post(`/api/sessions/${sessionId}/sets`).send({ exerciseId, setNumber: 3, weight: 50, reps: 10, rpe: 6 });
    expect(set3.body.isPr).toBe(false);

    const completed = await agent.post(`/api/sessions/${sessionId}/complete`);
    expect(completed.body.status).toBe("completed");
    expect(completed.body.completedAt).not.toBeNull();
  });

  it("rejects a set logged by a different athlete's session", async () => {
    const agentA = request.agent(app);
    await signUp(agentA, "athlete-a@example.com");
    const sessionA = await agentA.get("/api/sessions/today");

    const agentB = request.agent(app);
    await signUp(agentB, "athlete-b@example.com");

    const response = await agentB.post(`/api/sessions/${sessionA.body.id}/sets`).send({ exerciseId: sessionA.body.exercises[0].exerciseId, setNumber: 1, weight: 40, reps: 10 });
    expect(response.status).toBe(404);
  });

  it("rejects an invalid set payload (negative weight)", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const today = await agent.get("/api/sessions/today");
    const response = await agent
      .post(`/api/sessions/${today.body.id}/sets`)
      .send({ exerciseId: today.body.exercises[0].exerciseId, setNumber: 1, weight: -10, reps: 8 });
    expect(response.status).toBe(400);
  });
});

describe("athlete dashboard", () => {
  it("computes real streak, volume, and adherence after a completed session — no fabricated numbers", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const today = await agent.get("/api/sessions/today");
    const sessionId = today.body.id;
    const exerciseId = today.body.exercises[0].exerciseId;

    await agent.post(`/api/sessions/${sessionId}/start`);
    await agent.post(`/api/sessions/${sessionId}/sets`).send({ exerciseId, setNumber: 1, weight: 60, reps: 8 });
    await agent.post(`/api/sessions/${sessionId}/sets`).send({ exerciseId, setNumber: 2, weight: 65, reps: 6 });
    await agent.post(`/api/sessions/${sessionId}/complete`);

    const home = await agent.get("/api/athlete/home");
    expect(home.status).toBe(200);
    expect(home.body.streakDays).toBe(1);
    expect(home.body.weeklyVolume).toBe(60 * 8 + 65 * 6);
    expect(home.body.adherencePercent).toBe(25); // 1 of a 4-session weekly target
    // Regression test: a session spanning exercises with compound muscle-group
    // labels ("Chest · Triceps", "Upper chest") previously produced a
    // duplicated subtitle like "Chest · Triceps · Upper chest · Chest · Triceps".
    const parts = home.body.today.subtitle.split(" · ");
    expect(new Set(parts).size).toBe(parts.length);
  });

  it("returns an honest zero-state for a brand-new athlete with no sets logged", async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const home = await agent.get("/api/athlete/home");
    expect(home.body.streakDays).toBe(0);
    expect(home.body.weeklyVolume).toBe(0);
    expect(home.body.insight).toMatch(/log your first set/i);
  });
});
