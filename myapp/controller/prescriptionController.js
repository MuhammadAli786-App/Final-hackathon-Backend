import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import User from "../models/userSchema.js";
import { generatePrescriptionPDF } from "../utlis/generatePrescriptionPDF.js";
import path from "path";

const callAI = async (payload) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI API key not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI provider error: ${res.status} ${txt}`);
  }

  return res.json();
};

const explainFallback = (prescription, patient) => {
  const medList = (prescription.medicines || []).map((m) => `• ${m.name} — ${m.dosage || ""} for ${m.duration || ""}`).join("\n");
  return {
    explanation: `You have been prescribed the following medicines:\n${medList}\nFollow the doctor's instructions. If you experience side effects, contact your doctor.`,
    lifestyle: "Maintain hydration, rest, and follow up if symptoms persist.",
  };
};

export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, instructions } = req.body;

    const patient = await Patient.findById(patientId);
    const doctor = await User.findById(req.user._id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user._id,
      medicines,
      instructions,
    });

    const pdfPath = await generatePrescriptionPDF(
      prescription,
      patient,
      doctor
    );

    prescription.pdfUrl = pdfPath;
    await prescription.save();

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE A PRESCRIPTION (doctor only)
export const updatePrescription = async (req, res) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) return res.status(404).json({ message: "Prescription not found" });

    // only doctor who created it may update? we'll allow any doctor for simplicity
    if (req.body.medicines) pres.medicines = req.body.medicines;
    if (req.body.instructions) pres.instructions = req.body.instructions;
    if (req.body.patientId) pres.patientId = req.body.patientId;

    const updated = await pres.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE A PRESCRIPTION (doctor only)
export const deletePrescription = async (req, res) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) return res.status(404).json({ message: "Prescription not found" });

    await pres.deleteOne();
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate(
      "patientId doctorId",
      "name"
    );
    if (!prescription) return res.status(404).json({ message: "Not found" });

    if (!prescription.pdfUrl) return res.status(404).json({ message: "PDF not generated" });

    const filePath = path.resolve(prescription.pdfUrl);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const explainPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate("patientId doctorId", "name age gender");
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    const patient = prescription.patientId;

    // Prepare prompt
    const system = `You are a helpful medical assistant. Given a prescription object (medicines array with name, dosage, duration, and instructions), produce a short plain-language explanation for the patient, a brief note on lifestyle recommendations, and optional warnings. Respond ONLY with valid JSON with keys: explanation, lifestyle, warnings (array).`;

    const userContent = `Prescription: ${JSON.stringify({ medicines: prescription.medicines, instructions: prescription.instructions })}\nPatient: ${patient ? JSON.stringify({ name: patient.name, age: patient.age, gender: patient.gender }) : "unknown"}`;

    let result = null;
    try {
      const payload = {
        model: process.env.AI_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 400,
      };

      const aiResp = await callAI(payload);
      const content = aiResp?.choices?.[0]?.message?.content || "";
      const jsonStart = content.indexOf("{");
      const jsonText = jsonStart >= 0 ? content.slice(jsonStart) : content;
      result = JSON.parse(jsonText);
    } catch (err) {
      result = explainFallback(prescription, patient);
    }

    prescription.aiExplanation = result.explanation || JSON.stringify(result);
    await prescription.save();

    return res.json({ message: "Explanation generated", result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
