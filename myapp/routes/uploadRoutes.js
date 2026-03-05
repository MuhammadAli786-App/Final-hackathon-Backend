import express from "express";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import { uploadPatientDocument, uploadPrescriptionAttachment, deleteUploadedFile } from "../controller/uploadController.js";

const router = express.Router();

// Upload patient document
router.post("/patient-document", checkAuth, roleMiddleware("admin", "receptionist", "doctor"), upload.single("file"), uploadPatientDocument);

// Upload prescription attachment
router.post("/prescription-attachment", checkAuth, roleMiddleware("admin", "doctor"), upload.single("file"), uploadPrescriptionAttachment);

// Delete file (admin only)
router.delete("/file", checkAuth, roleMiddleware("admin"), deleteUploadedFile);

export default router;
