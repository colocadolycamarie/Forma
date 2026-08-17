import { Router, type IRouter } from "express";
import { z } from "zod";
import { logSetInputSchema } from "@forma/shared";
import { requireAuth } from "../auth/middleware.js";
import {
  completeSession,
  getExerciseHistory,
  getTodaySessionDetail,
  logSet,
  startSession,
} from "../services/workout.service.js";

const router: IRouter = Router();
router.use(requireAuth);

const sessionIdParams = z.object({ sessionId: z.string().min(1) });
const exerciseIdParams = z.object({ exerciseId: z.string().min(1) });

router.get("/sessions/today", async (req, res): Promise<void> => {
  try {
    const session = await getTodaySessionDetail(req.session.userId!);
    if (!session) {
      res.status(404).json({ error: "No session available for today." });
      return;
    }
    res.json(session);
  } catch (error) {
    req.log.error({ error }, "Failed to load today's session");
    res.status(500).json({ error: "Unable to load today's session." });
  }
});

router.post("/sessions/:sessionId/start", async (req, res): Promise<void> => {
  const params = sessionIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid session id." });
    return;
  }
  try {
    const session = await startSession(req.session.userId!, params.data.sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.json(session);
  } catch (error) {
    req.log.error({ error }, "Failed to start session");
    res.status(500).json({ error: "Unable to start this session." });
  }
});

router.post("/sessions/:sessionId/complete", async (req, res): Promise<void> => {
  const params = sessionIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid session id." });
    return;
  }
  try {
    const session = await completeSession(req.session.userId!, params.data.sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.json(session);
  } catch (error) {
    req.log.error({ error }, "Failed to complete session");
    res.status(500).json({ error: "Unable to complete this session." });
  }
});

router.post("/sessions/:sessionId/sets", async (req, res): Promise<void> => {
  const params = sessionIdParams.safeParse(req.params);
  const body = logSetInputSchema.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: "Invalid session id." });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid set data." });
    return;
  }
  try {
    const set = await logSet(req.session.userId!, params.data.sessionId, body.data);
    if (!set) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.status(201).json(set);
  } catch (error) {
    req.log.error({ error }, "Failed to log set");
    res.status(500).json({ error: "Unable to save that set." });
  }
});

router.get("/exercises/:exerciseId/history", async (req, res): Promise<void> => {
  const params = exerciseIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid exercise id." });
    return;
  }
  try {
    const history = await getExerciseHistory(req.session.userId!, params.data.exerciseId);
    if (!history) {
      res.status(404).json({ error: "Exercise not found." });
      return;
    }
    res.json(history);
  } catch (error) {
    req.log.error({ error }, "Failed to load exercise history");
    res.status(500).json({ error: "Unable to load exercise history." });
  }
});

export default router;
