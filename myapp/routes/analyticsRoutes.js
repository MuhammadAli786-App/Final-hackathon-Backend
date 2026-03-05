import express from "express";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import { adminStats, doctorStats } from "../controller/analyticsController.js";
import { featureMiddlewareLog } from "../middleware/featureMiddleware.js";

const router = express.Router();

// Admin only stats - requires analytics feature
router.get("/admin", checkAuth, roleMiddleware("admin"), featureMiddlewareLog("ANALYTICS_ACCESS"), adminStats);

// Doctor stats - requires analytics feature
router.get("/doctor", checkAuth, roleMiddleware("doctor"), featureMiddlewareLog("ANALYTICS_ACCESS"), doctorStats);

export default router;
