import { randomUUID, randomInt } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { LinkedCoach, RosterAthlete } from "@forma/shared";
import { db } from "../db/client.js";
import { coachLinksTable, usersTable } from "../db/schema.js";
import { getAthleteSummary } from "./dashboard.service.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read aloud/type
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/** Returns the coach's existing code, generating and persisting one on first request. */
export async function getOrCreateCoachCode(coachId: string): Promise<string> {
  const [user] = await db.select({ coachCode: usersTable.coachCode }).from(usersTable).where(eq(usersTable.id, coachId)).limit(1);
  if (user?.coachCode) return user.coachCode;

  // Retry on the (very unlikely) chance of a collision with another coach's code.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    try {
      await db.update(usersTable).set({ coachCode: code }).where(eq(usersTable.id, coachId));
      return code;
    } catch {
      continue;
    }
  }
  throw new Error("Could not generate a unique coach code — please try again.");
}

export async function linkAthleteToCoach(athleteId: string, code: string): Promise<LinkedCoach | { error: string }> {
  const [coach] = await db
    .select({ id: usersTable.id, displayName: usersTable.displayName, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.coachCode, code))
    .limit(1);

  if (!coach || coach.role !== "coach") {
    return { error: "That code doesn't match any coach." };
  }
  if (coach.id === athleteId) {
    return { error: "You can't link to your own code." };
  }

  const [existing] = await db
    .select()
    .from(coachLinksTable)
    .where(and(eq(coachLinksTable.coachId, coach.id), eq(coachLinksTable.athleteId, athleteId)))
    .limit(1);

  if (existing) {
    return {
      linkId: existing.id,
      coachId: coach.id,
      displayName: coach.displayName,
      email: coach.email,
      linkedAt: existing.createdAt.toISOString(),
    };
  }

  const id = randomUUID();
  await db.insert(coachLinksTable).values({ id, coachId: coach.id, athleteId });

  return {
    linkId: id,
    coachId: coach.id,
    displayName: coach.displayName,
    email: coach.email,
    linkedAt: new Date().toISOString(),
  };
}

export async function getLinkedCoaches(athleteId: string): Promise<LinkedCoach[]> {
  const rows = await db
    .select({
      linkId: coachLinksTable.id,
      coachId: coachLinksTable.coachId,
      linkedAt: coachLinksTable.createdAt,
      displayName: usersTable.displayName,
      email: usersTable.email,
    })
    .from(coachLinksTable)
    .innerJoin(usersTable, eq(usersTable.id, coachLinksTable.coachId))
    .where(eq(coachLinksTable.athleteId, athleteId))
    .orderBy(desc(coachLinksTable.createdAt));

  return rows.map((row) => ({ ...row, linkedAt: row.linkedAt.toISOString() }));
}

export async function getRoster(coachId: string): Promise<RosterAthlete[]> {
  const rows = await db
    .select({
      linkId: coachLinksTable.id,
      athleteId: coachLinksTable.athleteId,
      linkedAt: coachLinksTable.createdAt,
      displayName: usersTable.displayName,
      email: usersTable.email,
    })
    .from(coachLinksTable)
    .innerJoin(usersTable, eq(usersTable.id, coachLinksTable.athleteId))
    .where(eq(coachLinksTable.coachId, coachId))
    .orderBy(desc(coachLinksTable.createdAt));

  return Promise.all(
    rows.map(async (row) => {
      const summary = await getAthleteSummary(row.athleteId);
      return {
        linkId: row.linkId,
        athleteId: row.athleteId,
        displayName: row.displayName,
        email: row.email,
        linkedAt: row.linkedAt.toISOString(),
        ...summary,
      };
    }),
  );
}

/** Removes a link. Either participant (the coach or the athlete on that link) may do this. */
export async function removeLink(requestingUserId: string, linkId: string): Promise<boolean> {
  const [link] = await db.select().from(coachLinksTable).where(eq(coachLinksTable.id, linkId)).limit(1);
  if (!link) return false;
  if (link.coachId !== requestingUserId && link.athleteId !== requestingUserId) return false;

  await db.delete(coachLinksTable).where(eq(coachLinksTable.id, linkId));
  return true;
}
