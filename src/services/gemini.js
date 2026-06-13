import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Parses a raw text log into structured JSON data.
 * @param {string} text - User's raw input.
 * @returns {Promise<Object>} - The parsed JSON data.
 */
export async function parseWellnessLog(text) {
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing. Using mock data.");
    return {
      symptoms: ["simulated symptom"],
      sleep: "simulated sleep",
      diet_notes: "simulated diet",
      severity: "low",
      summary: "Simulated summary of: " + text
    };
  }

  const prompt = `
    You are a medical parser for a wellness app. 
    Analyze the following user input and return a JSON object with strictly these keys:
    - "symptoms": an array of strings (e.g., ["joint pain", "headache"]). Empty array if none.
    - "sleep": string description of sleep quality (e.g., "poor", "good", "none mentioned").
    - "diet_notes": string description of diet/food mentioned.
    - "severity": string ("low", "medium", "high") based on the language used.
    - "summary": A short 1-sentence summary of the entry.

    IMPORTANT: Return ONLY valid JSON, without markdown formatting or code blocks.
    
    User Input: "${text}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean up potential markdown formatting if the model still includes it
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error parsing wellness log with Gemini:", error);
    throw new Error("Failed to parse the log. Please try again.");
  }
}

/**
 * Generates predictive insights based on historical logs.
 * @param {Array} historyData - Array of parsed log objects.
 * @returns {Promise<string>} - A 2-sentence pattern recognition insight.
 */
export async function getPredictiveInsights(historyData) {
  if (!historyData || historyData.length === 0) {
    return "Not enough data yet to provide insights. Keep logging your daily wellness!";
  }

  if (!apiKey) {
    return "Simulated Insight: We noticed you log data often. API key is missing to provide real insights.";
  }

  const prompt = `
    You are a helpful, reassuring predictive analyst for a daily wellness app designed for the elderly.
    Analyze the following 14-day log history and provide a plain-english insight.
    Identify any simple correlations between their symptoms, sleep, and diet.
    Do NOT offer strict medical advice or diagnoses. Keep it to exactly two friendly, reassuring sentences.
    
    Log History (JSON):
    ${JSON.stringify(historyData)}
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return "We couldn't analyze your patterns today. Please check back later.";
  }
}
