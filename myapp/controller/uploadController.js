import { uploadToCloudinary } from "../middleware/multer.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";

export const uploadPatientDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const { patientId } = req.body;
    if (!patientId) return res.status(400).json({ message: "patientId required" });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, "clinic/patients");

    // Store in patient record if needed (optional)
    if (!patient.documents) patient.documents = [];
    patient.documents.push({ url: result.secure_url, fileName: req.file.originalname, uploadedAt: new Date() });
    await patient.save();

    return res.json({ message: "Document uploaded", url: result.secure_url, fileId: result.public_id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const uploadPrescriptionAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const { prescriptionId } = req.body;
    if (!prescriptionId) return res.status(400).json({ message: "prescriptionId required" });

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, "clinic/prescriptions");

    // Store in prescription record
    if (!prescription.attachments) prescription.attachments = [];
    prescription.attachments.push({ url: result.secure_url, fileName: req.file.originalname, uploadedAt: new Date() });
    await prescription.save();

    return res.json({ message: "Attachment uploaded", url: result.secure_url, fileId: result.public_id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteUploadedFile = async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: "fileId required" });

    // Delete from Cloudinary (requires admin)
    const result = await new Promise((resolve, reject) => {
      const cloudinary = require("cloudinary").v2;
      cloudinary.uploader.destroy(fileId, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    return res.json({ message: "File deleted", result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
