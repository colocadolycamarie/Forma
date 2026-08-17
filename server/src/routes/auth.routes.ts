import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { loginInputSchema, signupInputSchema, type PublicUser } from "@forma/shared";
import { db } from "../db/client.js";
import { usersTable } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { requireAuth } from "../auth/middleware.js";

const router: IRouter = Router();

function toPublicUser(user: { id: string; email: string; displayName: string; createdAt: Date }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/signup", async (req, res): Promise<void> => {
  const parsed = signupInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const { email, password, displayName } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  await db.insert(usersTable).values({ id, email, passwordHash, displayName });

  req.session.userId = id;
  const [created] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.status(201).json(toPublicUser(created));
});

router.post("/login", async (req, res): Promise<void> => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }

  req.session.userId = user.id;
  res.json(toPublicUser(user));
});

router.post("/logout", (req, res): void => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: "Unable to log out." });
      return;
    }
    res.clearCookie("forma.sid");
    res.status(204).send();
  });
});

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Session is no longer valid." });
    return;
  }
  res.json(toPublicUser(user));
});

export default router;
