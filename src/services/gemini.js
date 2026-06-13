import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;

async function generateWithFallback(prompt) {
  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      console.warn(`[Gemini] ${modelName} failed:`, err.message);
      lastError = err;
      // Abort immediately on auth errors
      if (err.status === 401 || err.status === 403) throw err;
    }
  }
  throw lastError;
}

/**
 * Parses a raw text log into structured JSON data.
 * @param {string} text - User's raw input.
 * @returns {Promise<Object>} - The parsed JSON data.
 */
export async function parseWellnessLog(text, quickStats = {}) {
  const hasText = text && text.trim().length > 0;
  const hasStats = Object.keys(quickStats).length > 0;
  
  if (!apiKey) {
    const lower = (text || '').toLowerCase();
    const knownSymptoms = ['headache', 'fever', 'dizziness', 'nausea', 'cough', 'fatigue', 'pain', 'ache'];
    const symptoms = knownSymptoms.filter((symptom) => lower.includes(symptom));
    const sleepMatch = lower.match(/(\d+)\s*(hours?|hrs?)/);
    const severity = /(severe|very bad|intense|unbearable)/.test(lower)
      ? 'high'
      : /(mild|little|brief|slight)/.test(lower) ? 'low' : symptoms.length ? 'medium' : 'low';
    
    let summary = text && text.length > 86 ? `${text.slice(0, 83)}...` : text || 'Quick Stats Update';
    
    return {
      symptoms,
      sleep: quickStats['Sleep Quality'] || (sleepMatch ? `${sleepMatch[1]} hours mentioned` : lower.includes('sleep') ? 'Sleep mentioned' : 'Not mentioned'),
      hydration: quickStats['Hydration'] || (lower.includes('water') || lower.includes('hydration') ? 'Mentioned' : 'Not mentioned'),
      diet_notes: quickStats['Appetite'] ? `Appetite: ${quickStats['Appetite']}` : lower.includes('breakfast') ? 'Breakfast mentioned' : 'Not mentioned',
      severity,
      summary,
      quickStats
    };
  }

  const quickStatsStr = hasStats ? JSON.stringify(quickStats) : "None provided";
  const userTextStr = hasText ? `"${text}"` : "No text provided.";

  const prompt = `
    You are a medical parser for a wellness app. 
    Analyze the following user input AND their selected quick stats.
    Return a JSON object with strictly these keys:
    - "symptoms": an array of strings (e.g., ["joint pain", "headache"]). Empty array if none.
    - "sleep": string description of sleep quality (e.g., "poor", "good", "none mentioned"). Incorporate the quick stats if relevant.
    - "diet_notes": string description of diet/food mentioned.
    - "severity": string ("low", "medium", "high") based on the language used.
    - "summary": A short 1-sentence summary of the entry combining the context of their text and quick stats.

    IMPORTANT: Return ONLY valid JSON, without markdown formatting or code blocks.
    
    User Input: ${userTextStr}
    Quick Stats: ${quickStatsStr}
  `;

  try {
    const result = await generateWithFallback(prompt);
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
 * Generates predictive insights based on historical logs, visits, and appointments.
 * @param {Array} logs - Array of parsed log objects.
 * @param {Array} visits - Array of doctor visits.
 * @param {Array} appointments - Array of appointments.
 * @returns {Promise<Array>} - An array of insight objects.
 */
export async function getPredictiveInsights(logs, visits = [], appointments = []) {
  if (!logs || logs.length === 0) {
    return [{ title: "Need More Data", description: "Not enough data yet to provide insights. Keep logging your daily wellness!", type: "neutral" }];
  }

  if (!apiKey) {
    return [{ title: "Simulated Insight", description: "We noticed you log data often. API key is missing to provide real insights.", type: "neutral" }];
  }

  const prompt = `
    You are a helpful, reassuring predictive analyst for a daily wellness app designed for the elderly.
    Analyze the following recent data, which includes the patient's daily health logs, doctor's visits/care plans, and upcoming appointments.
    
    Generate exactly 2 to 5 distinct insights based on patterns you observe. 
    Identify simple correlations between symptoms, sleep, diet, and doctor recommendations.
    Do NOT offer strict medical advice or diagnoses. Keep descriptions to 1-2 friendly, reassuring sentences.

    Return the result strictly as a JSON object with two keys:
    - "summaryInsight": An object representing the most important high-level insight for the dashboard (must have "title", "description", and "type").
    - "insights": A JSON array of 2 to 5 distinct insight objects for the detailed insights page (each with "title", "description", and "type").

    IMPORTANT: Return ONLY valid JSON, without markdown formatting or code blocks.
    
    Data Context:
    Logs: ${JSON.stringify(logs)}
    Doctor Visits: ${JSON.stringify(visits)}
    Appointments: ${JSON.stringify(appointments)}
  `;

  try {
    const result = await generateWithFallback(prompt);
    const responseText = result.response.text();
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    return {
      summaryInsight: { title: "Analysis Failed", description: "We couldn't analyze your patterns today.", type: "warning" },
      insights: [{ title: "Analysis Failed", description: "Please check back later.", type: "warning" }]
    };
  }
}
