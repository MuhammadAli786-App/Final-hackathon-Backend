// Existing imports
import { getPrescriptionExplanationEndpoint } from "../controllers/prescriptionController.js";

// GET AI Prescription Explanation
router.get(
  "/:prescriptionId/explanation",
  checkAuth,
  roleMiddleware("doctor", "patient"),
  getPrescriptionExplanationEndpoint
);
