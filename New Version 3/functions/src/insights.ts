// functions/src/insights.ts
import * as functions from "firebase-functions";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Gemini Client Initialization ---
const API_KEY = process.env.GEMINI_API_KEY; // Assumes GEMINI_API_KEY is set in your env
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (!API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY not set in function configuration.");
} else {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro", // Use Pro for higher quality, nuanced insights
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
}
// --- End Gemini Client Initialization ---

// Interface for the data we expect from the client
interface DashboardData {
  wellnessScore: number;
  emotionalTrend: string; // 'improving', 'stable', 'declining'
  latestPhq9: number | null;
  latestGad7: number | null;
  phq9Trend: string;
  gad7Trend: string;
  recentSessionTopics: string[]; // e.g., ["family", "work stress"]
  recentJournalMoods: string[]; // e.g., ["happy", "sad", "neutral"]
  userLanguage: string; // e.g., "hi-IN", "en-IN", "mr-IN"
  userName: string;
}

export const getDashboardInsights = functions.https.onCall(async (data: DashboardData, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  if (!model) {
    throw new functions.https.HttpsError("internal", "AI model is not initialized. Check API key.");
  }

  const {
    wellnessScore,
    emotionalTrend,
    latestPhq9,
    latestGad7,
    phq9Trend,
    gad7Trend,
    userLanguage,
    userName,
  } = data;

  // Determine the language for the response
  const langKey = userLanguage.split('-')[0] || 'en';
  let languageName = "English";
  switch (langKey) {
    case 'hi': languageName = "Hindi"; break;
    case 'mr': languageName = "Marathi"; break;
    case 'bn': languageName = "Bengali"; break;
    case 'ta': languageName = "Tamil"; break;
    // Add other languages as needed
    default: languageName = "English";
  }

  // Construct the prompt for Gemini
  const prompt = `You are "MannMitra," an empathetic and wise mental health companion.

Your task is to provide a "Today's Insight" summary for a user named ${userName} based on their dashboard data.

The response MUST be in ${languageName}.
The response MUST be a single, short paragraph (2-3 sentences, 40-60 words max).
Be warm, encouraging, and insightful. DO NOT sound like a robot. DO NOT use bullet points.

Here is the user's data:
- Language: ${languageName}
- Wellness Score: ${wellnessScore}/100
- Overall Emotional Trend: ${emotionalTrend}
- Latest PHQ-9 (Depression) Score: ${latestPhq9 ?? 'N/A'} (Trend: ${phq9Trend})
- Latest GAD-7 (Anxiety) Score: ${latestGad7 ?? 'N/A'} (Trend: ${gad7Trend})

**How to respond:**
1.  **Acknowledge:** Start with a warm greeting (e.g., "Hello ${userName}," "Namaste ${userName}," etc., in the correct language).
2.  **Highlight a Positive:** Find one positive thing (e.g., "improving" trend, high wellness score, "stable" trend).
3.  **Address a Challenge (Gently):** If there's a clear challenge (e.g., "declining" trend, high GAD-7 score), acknowledge it gently and link it to an action.
4.  **Encourage:** End with a simple, encouraging sentence related to their journey.

**Example (English, Good):**
"Hello ${userName}, it's great to see your emotional trend is improving. Your wellness score reflects that hard work. Keep nurturing this progress, one day at a time."

**Example (English, Challenging):**
"Hello ${userName}, I see your anxiety score is a bit high lately, which can feel tough. Remember to be kind to yourself today. Perhaps a short breathing exercise from the app could help?"

**Example (Hindi, Good):**
"नमस्ते ${userName}, यह देखकर अच्छा लगा कि आपकी भावनात्मक स्थिति में सुधार हो रहा है। आपका वेलनेस स्कोर आपकी मेहनत को दर्शाता है। इस प्रगति को बनाए रखें, एक समय में एक दिन।"

**Example (Hindi, Challenging):**
"नमस्ते ${userName}, मैं देख रहा हूँ कि आपका चिंता स्कोर थोड़ा अधिक है, जो कठिन हो सकता है। आज खुद के प्रति दयालु रहें। शायद ऐप से एक छोटा साँस लेने का व्यायाम मदद कर सकता है?"

Now, generate the insight based on the data provided. Respond ONLY with the single paragraph of text.`;

  try {
    console.log(`Generating dashboard insight for user ${context.auth.uid} in ${languageName}`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const insightText = response.text();

    // Clean up the response, removing potential markdown or "Insight:" prefixes
    const cleanedInsight = insightText
      .replace(/\"/g, '') // Remove quotes
      .replace(/\*/g, '') // Remove asterisks
      .replace(/Insight:/i, '') // Remove "Insight:" prefix
      .trim();

    return { insight: cleanedInsight };

  } catch (error: any) {
    console.error(`Error generating dashboard insight for user ${context.auth.uid}:`, error);
    
    // Handle potential safety blocks
    if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
      throw new functions.https.HttpsError("internal", "AI response blocked due to safety settings.", { reason: error.response.promptFeedback.blockReason });
    }
    
    throw new functions.https.HttpsError("internal", "Failed to generate AI insight.", { message: error.message });
  }
});