import { Router, type IRouter } from "express";
import authRoutes from "./auth.routes.js";
import coachRoutes from "./coach.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import healthRoutes from "./health.routes.js";
import workoutsRoutes from "./workouts.routes.js";

const router: IRouter = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use(dashboardRoutes);
router.use(workoutsRoutes);
router.use(coachRoutes);

export default router;
