import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { usersTable } from "../db/schema.js";
import type { UserRole } from "@forma/shared";

/** Blocks the request unless a logged-in session is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
}

/** Blocks the request unless the logged-in user has the given role. Must run after requireAuth. */
export function requireRole(role: UserRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    if (!user || user.role !== role) {
      res.status(403).json({ error: `Only ${role} accounts can do this.` });
      return;
    }
    next();
  };
}
