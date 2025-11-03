import { onDocumentWritten } from "firebase-functions/v2/firestore";
// import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
// import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK (do this only once)
admin.initializeApp();
const db = admin.firestore();

// // Define the API key parameter
// const geminiApiKey = defineString("GEMINI_API_KEY");

// Initialize Google AI
const getGenAI = () => {
    // Read directly from process.env, populated by the .env file during deploy
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Updated error message
        throw new Error("Gemini API Key not set in function environment variables. Ensure .env.<project_id> file exists and includes GEMINI_API_KEY.");
    }
    return new GoogleGenerativeAI(apiKey);
};

const getModel = () => {
    const genAI = getGenAI();
    return genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro",
        generationConfig: {
            temperature: 0.1, // Low temperature for consistent, reliable analysis
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 4096,
        }
    });
};

// Interface for AI Insights
interface AIInsights {
    sentimentScore: number;
    sentimentMagnitude: number;
    keyThemes: string[];
    positiveMentions: string[];
    negativeMentions: string[];
    potentialTriggers: string[];
    copingMentioned: string[];
    riskFlags: string[];
    summary: string;
    modelVersion: string;
    analysisTimestamp: admin.firestore.FieldValue;
}

// Validation function to catch and correct dangerous misanalyses
function validateAndCorrectInsights(insights: any, content: string, mood: string): any {
    const contentLower = content.toLowerCase();
    
    // Critical mental health phrases
    const suicidalPhrases = [
        'feel like dying', 'want to die', 'kill myself', 'end it all',
        'no point in living', 'better off dead', 'suicide', 'suicidal',
        'end my life', 'take my life', 'not worth living'
    ];
    
    const selfHarmPhrases = [
        'hurt myself', 'harm myself', 'cut myself', 'cutting', 'self harm'
    ];
    
    const hopelessPhrases = [
        'hopeless', 'no future', 'give up', 'can\'t go on', 'pointless'
    ];
    
    // Check for critical content
    const hasSuicidalContent = suicidalPhrases.some(phrase => contentLower.includes(phrase));
    const hasSelfHarmContent = selfHarmPhrases.some(phrase => contentLower.includes(phrase));
    const hasHopelessContent = hopelessPhrases.some(phrase => contentLower.includes(phrase));
    
    console.log(`🔍 CONTENT ANALYSIS for validation:`, {
        hasSuicidalContent,
        hasSelfHarmContent,
        hasHopelessContent,
        mood,
        originalSentiment: insights.sentimentScore
    });
    
    // Initialize risk flags if missing
    if (!insights.riskFlags) insights.riskFlags = [];
    
    // Force correct risk flags
    if (hasSuicidalContent && !insights.riskFlags.includes('suicidal_ideation')) {
        console.log(`⚠️ CORRECTION: Adding missing suicidal_ideation flag`);
        insights.riskFlags.push('suicidal_ideation');
    }
    
    if (hasSelfHarmContent && !insights.riskFlags.includes('self_harm_reference')) {
        console.log(`⚠️ CORRECTION: Adding missing self_harm_reference flag`);
        insights.riskFlags.push('self_harm_reference');
    }
    
    if (hasHopelessContent && !insights.riskFlags.includes('hopelessness')) {
        console.log(`⚠️ CORRECTION: Adding missing hopelessness flag`);
        insights.riskFlags.push('hopelessness');
    }
    
    // Force correct sentiment scores
    const hasHighRiskFlags = insights.riskFlags.includes('suicidal_ideation') || 
                            insights.riskFlags.includes('self_harm_reference');
    
    if (hasHighRiskFlags && insights.sentimentScore > -0.8) {
        console.log(`⚠️ CORRECTION: Fixing sentiment from ${insights.sentimentScore} to -0.9 due to high-risk content`);
        insights.sentimentScore = -0.9;
        insights.sentimentMagnitude = 0.9;
    }
    
    if ((mood === 'sad' || mood === 'very_sad') && insights.sentimentScore > 0) {
        console.log(`⚠️ CORRECTION: Fixing positive sentiment ${insights.sentimentScore} for sad mood to -0.6`);
        insights.sentimentScore = -0.6;
    }
    
    // Fix dangerous summaries
    if (insights.summary && hasHighRiskFlags) {
        const dangerousWords = ['playful', 'greeting', 'positive', 'cheerful', 'energetic', 'lighthearted'];
        const hasDangerousWords = dangerousWords.some(word => 
            insights.summary.toLowerCase().includes(word)
        );
        
        if (hasDangerousWords) {
            console.log(`⚠️ CORRECTION: Fixing dangerous summary for high-risk content`);
            if (hasSuicidalContent) {
                insights.summary = "User expressed serious distress and thoughts about death/dying.";
            } else if (hasSelfHarmContent) {
                insights.summary = "User mentioned thoughts of self-harm or self-injury.";
            }
        }
    }
    
    // Ensure negative mentions capture concerning content
    if (!insights.negativeMentions) insights.negativeMentions = [];
    
    if (hasSuicidalContent && !insights.negativeMentions.some((m: string) => 
        m.toLowerCase().includes('dying') || m.toLowerCase().includes('death'))) {
        insights.negativeMentions.push('thoughts about dying');
    }
    
    return insights;
}

// --- Cloud Function Trigger ---
export const analyzeJournalEntry = onDocumentWritten("journal_entries/{entryId}", async (event) => {
    const change = event.data;
    const entryId = event.params.entryId;

    if (!change) {
        console.log("No change data available");
        return;
    }

    // Get the new journal entry data
    const newData = change.after?.exists ? change.after.data() : null;
    // Get the previous data (if it was an update)
    const previousData = change.before?.exists ? change.before.data() : null;

    // --- Conditions to Trigger Analysis ---
    // 1. Only run on create or if content/mood updated significantly
    // 2. Only run if AI insights don't already exist or are very old
    // 3. Only run if newData exists (i.e., not a delete)
    if (!newData) {
        console.log("Journal entry deleted, skipping analysis.");
        return null;
    }

    // Check if analysis should run (avoid infinite loops, re-analysis on minor edits)
    // TEMPORARY: Set to true to force re-analysis of all entries for testing
    const FORCE_REANALYSIS = false; // Set to true to force re-analysis, then redeploy with false
    
    const shouldAnalyze = FORCE_REANALYSIS || 
        // Is it a new entry?
        !change.before?.exists ||
        // Or did content/mood change substantially?
        (previousData &&
            (newData.content !== previousData.content || newData.mood !== previousData.mood)) ||
        // And insights are missing or older than a day?
        (!newData.aiInsights ||
            !newData.aiInsights.analysisTimestamp ||
            (Date.now() - newData.aiInsights.analysisTimestamp.toDate().getTime()) > 24 * 60 * 60 * 1000);

    console.log(`📊 ANALYSIS DECISION for entry ${entryId}:`, {
        FORCE_REANALYSIS,
        isNewEntry: !change.before?.exists,
        contentChanged: previousData && newData.content !== previousData.content,
        moodChanged: previousData && newData.mood !== previousData.mood,
        hasInsights: !!newData.aiInsights,
        shouldAnalyze
    });

    if (!shouldAnalyze) {
        console.log(`⏭️ Skipping analysis for entry ${entryId}. Conditions not met.`);
        return null;
    }

    const content = newData.content;
    const mood = newData.mood;

    if (!content) {
        console.log(`Entry ${entryId} has no content, skipping.`);
        return null;
    }

    console.log(`Analyzing journal entry ${entryId}...`);

    try {
        // --- Prepare Prompt for Gemini ---
        const prompt = `You are a mental health AI assistant analyzing a journal entry. This is CRITICAL SAFETY ANALYSIS.

User's self-reported mood: "${mood}"
Journal Entry Content: "${content}"

RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "sentimentScore": <float between -1.0 and 1.0>,
  "sentimentMagnitude": <float between 0.0 and 1.0>,
  "keyThemes": ["<theme1>", "<theme2>"],
  "positiveMentions": ["<positive aspect>"],
  "negativeMentions": ["<negative aspect>"],
  "potentialTriggers": ["<trigger>"],
  "copingMentioned": ["<coping strategy>"],
  "riskFlags": ["<risk indicator>"],
  "summary": "<brief neutral summary>"
}

CRITICAL SAFETY GUIDELINES - FOLLOW EXACTLY OR ANALYSIS WILL BE REJECTED:

1. riskFlags - MANDATORY DETECTION - DO NOT MISS ANY:
   - MUST include 'suicidal_ideation' if ANY phrases related to death, dying, ending life, suicide, killing oneself, or not wanting to live are present
   - MUST include 'hopelessness' if despair, no future, giving up, or lack of hope is mentioned
   - MUST include 'self_harm_reference' if hurting oneself, cutting, or self-injury is mentioned
   - MUST include 'severe_depression' if extreme sadness, worthlessness, or inability to function is described
   - MUST include 'severe_isolation' if complete withdrawal or having no one is mentioned
   - ALWAYS err on the side of INCLUDING flags - missing them is dangerous

2. sentimentScore - ABSOLUTE REQUIREMENTS:
   - MUST be strongly negative (<= -0.8) if 'suicidal_ideation' or 'self_harm_reference' flags are present, regardless of ANY other words
   - MUST be negative (<= -0.5) if 'hopelessness' or 'severe_depression' flags are present
   - NEVER assign positive sentiment (>0) if ANY risk flags are indicated
   - NEVER assign positive sentiment if user mood is 'sad' or 'very_sad'
   - When in doubt, make it more negative, not less

3. summary - STRICT CONTENT RULES:
   - MUST reflect the serious nature if risk flags are present
   - ABSOLUTELY FORBIDDEN words for risky content: 'playful', 'greeting', 'positive', 'cheerful', 'energetic', 'lighthearted', 'fun', 'happy', 'upbeat'
   - Use clinical, neutral language for concerning content
   - Required format for suicidal content: "User expressed serious distress and thoughts about death/dying"
   - Required format for self-harm: "User mentioned thoughts of self-harm or self-injury"

4. negativeMentions - MANDATORY INCLUSION:
   - MUST include death/dying references if present
   - MUST include self-harm mentions if present
   - MUST include hopelessness expressions if present
   - MUST include any concerning mental health indicators

EXAMPLES OF CRITICAL PHRASES TO FLAG:
- "feel like dying", "want to die", "kill myself", "end it all"
- "no point in living", "better off dead", "suicide", "suicidal"
- "hurt myself", "cut myself", "harm myself"
- "hopeless", "no future", "give up", "can't go on"

Remember: This analysis could save lives. Accuracy in detecting risk is CRITICAL.`;

        // --- Call Gemini API ---
        console.log(`📝 PROMPT SENT TO GEMINI for entry ${entryId}:`);
        console.log(prompt);
        console.log(`📝 END PROMPT`);

        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log(`🤖 RAW GEMINI RESPONSE for entry ${entryId}:`);
        console.log(text);
        console.log(`🤖 END RAW RESPONSE`);

        // --- Parse Response ---
        let insights: Partial<AIInsights> = {};

        try {
            // Clean potential markdown code blocks
            const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
            console.log(`🧹 CLEANED TEXT for entry ${entryId}:`);
            console.log(cleanedText);
            
            const parsedInsights = JSON.parse(cleanedText);
            console.log(`✅ PARSED INSIGHTS for entry ${entryId}:`, parsedInsights);

            // Validate and correct dangerous misanalyses
            const validatedInsights = validateAndCorrectInsights(parsedInsights, content, mood);
            console.log(`🛡️ VALIDATED INSIGHTS for entry ${entryId}:`, validatedInsights);

            insights = {
                ...validatedInsights,
                modelVersion: "gemini-2.5-pro",
                analysisTimestamp: admin.firestore.FieldValue.serverTimestamp()
            };
        } catch (parseError) {
            console.error(`Failed to parse Gemini response for ${entryId}:`, parseError);
            console.error("Problematic Text:", text);

            // Save the raw text or an error state
            await db.collection("journal_entries").doc(entryId).update({
                "aiInsights.error": "Failed to parse analysis",
                "aiInsights.rawResponse": text.substring(0, 500),
                "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });
            return null;
        }

        // --- Update Firestore Document ---
        await db.collection("journal_entries").doc(entryId).update({
            aiInsights: insights,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Successfully analyzed and updated entry ${entryId}`);
        return null;

    } catch (error) {
        console.error(`Error analyzing journal entry ${entryId}:`, error);

        // Update the document with an error status
        await db.collection("journal_entries").doc(entryId).update({
            "aiInsights.error": `Analysis failed: ${(error as Error).message}`,
            "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    }
});

