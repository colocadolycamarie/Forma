import { Router, type IRouter } from "express";
import { z } from "zod";
import { linkCoachInputSchema } from "@forma/shared";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { getLinkedCoaches, getOrCreateCoachCode, getRoster, linkAthleteToCoach, removeLink } from "../services/coaching.service.js";

const router: IRouter = Router();
// Applied per-route, not via a global router.use() — see workouts.routes.ts
// for why an unscoped router-level middleware here would be fragile.

const linkIdParams = z.object({ linkId: z.string().min(1) });

router.get("/coach/code", requireAuth, requireRole("coach"), async (req, res): Promise<void> => {
  try {
    const code = await getOrCreateCoachCode(req.session.userId!);
    res.json({ code });
  } catch (error) {
    req.log.error({ error }, "Failed to get coach code");
    res.status(500).json({ error: "Unable to load your coach code." });
  }
});

router.get("/coach/roster", requireAuth, requireRole("coach"), async (req, res): Promise<void> => {
  try {
    const roster = await getRoster(req.session.userId!);
    res.json(roster);
  } catch (error) {
    req.log.error({ error }, "Failed to load roster");
    res.status(500).json({ error: "Unable to load your roster." });
  }
});

router.get("/coach/mine", requireAuth, requireRole("athlete"), async (req, res): Promise<void> => {
  try {
    const coaches = await getLinkedCoaches(req.session.userId!);
    res.json(coaches);
  } catch (error) {
    req.log.error({ error }, "Failed to load linked coaches");
    res.status(500).json({ error: "Unable to load your coach." });
  }
});

router.post("/coach/link", requireAuth, requireRole("athlete"), async (req, res): Promise<void> => {
  const parsed = linkCoachInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid code." });
    return;
  }
  try {
    const result = await linkAthleteToCoach(req.session.userId!, parsed.data.code);
    if ("error" in result) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(201).json(result);
  } catch (error) {
    req.log.error({ error }, "Failed to link coach");
    res.status(500).json({ error: "Unable to connect to that coach." });
  }
});

router.delete("/coach/links/:linkId", requireAuth, async (req, res): Promise<void> => {
  const params = linkIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid connection id." });
    return;
  }
  try {
    const removed = await removeLink(req.session.userId!, params.data.linkId);
    if (!removed) {
      res.status(404).json({ error: "That connection wasn't found." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Failed to remove link");
    res.status(500).json({ error: "Unable to remove that connection." });
  }
});

export default router;
