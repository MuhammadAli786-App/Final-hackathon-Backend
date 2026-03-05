import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getPrescriptionExplanation = async ({ prescription, patientName, urduMode = false }) => {
  try {
    const medicinesList = prescription.medicines
      .map(m => `${m.name} - ${m.dosage} - ${m.duration}`)
      .join("\n");

    const prompt = `
Patient: ${patientName}
Prescription:
${medicinesList}

Instructions: ${prescription.instructions || "None"}

Write a simple, easy-to-understand explanation for the patient, including:
- Purpose of each medicine
- Lifestyle advice
- Preventive tips
${urduMode ? "Provide explanation in Urdu." : ""}

Respond in plain text.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Prescription Explanation failed:", error.message);
    return "Explanation not available at the moment. Please follow doctor's instructions.";
  }
};
