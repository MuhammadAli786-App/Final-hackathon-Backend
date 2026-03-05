import DiagnosisLog from "../models/DiagnosisLog.js";
import Patient from "../models/Patient.js";
import User from "../models/userSchema.js";

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

  const json = await res.json();
  return json;
};

const analyzeFallback = (symptoms, age, gender, history) => {
  const s = (symptoms || "").toLowerCase();
  const conditions = [];
  let risk = "low";

  if (s.includes("fever") || s.includes("cough") || s.includes("breath")) {
    conditions.push("Respiratory infection (possible)");
  }
  if (s.includes("chest pain") || s.includes("pressure")) {
    conditions.push("Cardiac event (urgent)");
    risk = "high";
  }
  if (s.includes("headache") && s.includes("sudden")) {
    conditions.push("Possible migraine or vascular event");
    risk = "medium";
  }
  if (conditions.length === 0) conditions.push("General viral illness or non-specific symptoms");

  const suggestedTests = [];
  if (risk === "high") suggestedTests.push("ECG", "Troponin");
  if (s.includes("fever")) suggestedTests.push("CBC", "CRP");
  if (s.includes("cough")) suggestedTests.push("Chest X-ray", "Pulse oximetry");

  return {
    conditions,
    risk,
    suggestedTests,
    explanation: "This is a fallback assessment. For accurate diagnosis, use AI service or consult a clinician.",
  };
};

export const runSymptomChecker = async (req, res) => {
  try {
    const { symptoms, age, gender, history } = req.body;
    if (!symptoms) return res.status(400).json({ message: "Symptoms are required" });

    // Basic patient/doctor lookup (optional)
    const patient = history?.patientId ? await Patient.findById(history.patientId) : null;
    const doctor = await User.findById(req.user._id);

    // Prepare AI prompt asking for JSON only
    const system = `You are a clinical decision support assistant. Given patient's symptoms, age, gender, and history, return a JSON object with keys: conditions (array of strings), risk (one of low|medium|high), suggestedTests (array of strings), explanation (short string). Respond ONLY with valid JSON.`;

    const userPrompt = `Symptoms: ${symptoms}\nAge: ${age || "unknown"}\nGender: ${gender || "unknown"}\nHistory: ${history || "none"}\n`;

    let aiResult = null;

    try {
      const payload = {
        model: process.env.AI_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
      };

      const aiResp = await callAI(payload);
      const content = aiResp?.choices?.[0]?.message?.content || "";
      // Parse JSON from model output
      const jsonStart = content.indexOf("{");
      const jsonText = jsonStart >= 0 ? content.slice(jsonStart) : content;
      aiResult = JSON.parse(jsonText);
    } catch (err) {
      // fallback
      aiResult = analyzeFallback(symptoms, age, gender, history);
    }

    // Save log
    const log = await DiagnosisLog.create({
      patientId: history?.patientId || null,
      doctorId: req.user._id,
      symptoms,
      aiResponse: JSON.stringify(aiResult),
      riskLevel: aiResult.risk || "low",
    });

    return res.json({ message: "Analysis complete", logId: log._id, result: aiResult });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getPatientDiagnosisLogs = async (req, res) => {
  try {
    const patientId = req.params.id;
    const logs = await DiagnosisLog.find({ patientId }).sort({ createdAt: -1 });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getDiagnosisLog = async (req, res) => {
  try {
    const log = await DiagnosisLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });
    return res.json(log);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// === NEW: manual log CRUD by doctors ===
export const createDiagnosisLog = async (req, res) => {
  try {
    const { patientId, symptoms, aiResponse, riskLevel } = req.body;
    if (!patientId || !symptoms) {
      return res.status(400).json({ message: "patientId and symptoms are required" });
    }
    const log = await DiagnosisLog.create({
      patientId,
      doctorId: req.user._id,
      symptoms,
      aiResponse: aiResponse || null,
      riskLevel: riskLevel || "low",
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDiagnosisLog = async (req, res) => {
  try {
    const log = await DiagnosisLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found" });
    // allow updating any of the fields except doctorId/patientId optionally
    const { symptoms, aiResponse, riskLevel } = req.body;
    if (symptoms !== undefined) log.symptoms = symptoms;
    if (aiResponse !== undefined) log.aiResponse = aiResponse;
    if (riskLevel !== undefined) log.riskLevel = riskLevel;
    const updated = await log.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDiagnosisLog = async (req, res) => {
  try {
    const log = await DiagnosisLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found" });
    await log.deleteOne();
    res.json({ message: "Log deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * CREATE DIAGNOSIS LOG + AI SYMPTOM CHECK
 */

