import { getPrescriptionExplanation } from "../services/aiPrescriptionService.js";
import Prescription from "../models/prescriptionModel.js";
import Patient from "../models/patientModel.js";

/**
 * GET AI Prescription Explanation
 */
export const getPrescriptionExplanationEndpoint = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { urduMode } = req.query; // optional: ?urduMode=true

    const prescription = await Prescription.findById(prescriptionId).populate("patientId", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const explanation = await getPrescriptionExplanation({
      prescription,
      patientName: prescription.patientId.name,
      urduMode: urduMode === "true",
    });

    res.json({ explanation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
