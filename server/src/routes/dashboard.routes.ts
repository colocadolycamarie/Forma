import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { usersTable } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { getAthleteHome } from "../services/dashboard.service.js";

const router: IRouter = Router();

router.get("/athlete/home", requireAuth, requireRole("athlete"), async (req, res): Promise<void> => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Session is no longer valid." });
      return;
    }
    const home = await getAthleteHome(user);
    res.json(home);
  } catch (error) {
    req.log.error({ error }, "Failed to load athlete home");
    res.status(500).json({ error: "Unable to load your dashboard." });
  }
});

export default router;
