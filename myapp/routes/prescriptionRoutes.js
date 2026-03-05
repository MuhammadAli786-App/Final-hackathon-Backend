import express from "express";
import { createPrescription, getPrescriptionPDF, updatePrescription, deletePrescription } from "../controller/prescriptionController.js";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import { explainPrescription } from "../controller/prescriptionController.js";
import { featureMiddlewareLog } from "../middleware/featureMiddleware.js";

const router = express.Router();

router.post(
  "/",
  checkAuth,
  // only doctors should write prescriptions
  roleMiddleware("doctor"),
  featureMiddlewareLog("PRESCRIPTION_CREATION"),
  createPrescription
);

// update and delete are doctor-only as well
router.put(
  "/:id",
  checkAuth,
  roleMiddleware("doctor"),
  updatePrescription
);

router.delete(
  "/:id",
  checkAuth,
  roleMiddleware("doctor"),
  deletePrescription
);

router.get("/:id/pdf", checkAuth, roleMiddleware("doctor", "admin", "patient"), featureMiddlewareLog("PRESCRIPTION_PDF"), getPrescriptionPDF);

// update & delete
router.put("/:id", checkAuth, roleMiddleware("doctor"), updatePrescription);
router.delete("/:id", checkAuth, roleMiddleware("doctor"), deletePrescription);

// explanation is a doctor-only feature as well
router.post("/:id/explain", checkAuth, roleMiddleware("doctor"), featureMiddlewareLog("AI_PRESCRIPTION_EXPLANATION"), explainPrescription);

export default router;
