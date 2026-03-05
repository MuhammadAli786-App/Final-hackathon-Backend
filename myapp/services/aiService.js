import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getSymptomAnalysis = async ({ symptoms, age, gender }) => {
  try {
    const prompt = `
    Patient details:
    Age: ${age}
    Gender: ${gender}
    Symptoms: ${symptoms}

    Provide:
    1. Possible conditions
    2. Risk level (low/medium/high)
    3. Suggested tests
    Format as JSON:
    { "conditions": [], "riskLevel": "", "suggestedTests": [] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const aiText = response.choices[0].message.content;

    // Attempt to parse JSON safely
    const aiData = JSON.parse(aiText);
    return aiData;
  } catch (error) {
    console.error("AI call failed:", error.message);
    return {
      conditions: ["Unable to analyze automatically"],
      riskLevel: "unknown",
      suggestedTests: [],
    };
  }
};
