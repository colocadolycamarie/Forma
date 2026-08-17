import type { NextFunction, Request, Response } from "express";

/** Blocks the request unless a logged-in session is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
}
