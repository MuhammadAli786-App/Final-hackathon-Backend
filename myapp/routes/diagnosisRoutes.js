import express from "express";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import {
  runSymptomChecker,
  getPatientDiagnosisLogs,
  getDiagnosisLog,
  createDiagnosisLog,
  updateDiagnosisLog,
  deleteDiagnosisLog,
} from "../controller/diagnosisController.js";
import { featureMiddlewareLog } from "../middleware/featureMiddleware.js";

const router = express.Router();

// POST /api/diagnosis/check  -> run AI symptom checker and save log
// only doctors may run symptom checker
router.post("/check", checkAuth, roleMiddleware("doctor"), featureMiddlewareLog("AI_SYMPTOM_CHECKER"), runSymptomChecker);

// GET patient logs
router.get("/patient/:id", checkAuth, roleMiddleware("doctor", "admin", "receptionist"), getPatientDiagnosisLogs);

// GET single log
router.get("/:id", checkAuth, roleMiddleware("doctor", "admin"), getDiagnosisLog);

// manual log CRUD (doctors only)
router.post("/log", checkAuth, roleMiddleware("doctor"), createDiagnosisLog);
router.put("/:id", checkAuth, roleMiddleware("doctor"), updateDiagnosisLog);
router.delete("/:id", checkAuth, roleMiddleware("doctor"), deleteDiagnosisLog);

export default router;
