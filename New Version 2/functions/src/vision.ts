// import * as functions from "firebase-functions";
// import { ImageAnnotatorClient, protos } from "@google-cloud/vision"; // Import protos

// const visionClient = new ImageAnnotatorClient();

// // Interface for the expected return structure (similar to EmotionDetectionResult)
// interface VisionAnalysisResult {
//     faceDetected: boolean;
//     emotions: {
//         joy: number;
//         sorrow: number;
//         anger: number;
//         surprise: number;
//         // Vision API also provides underExposed, blurred, headwear likelihoods
//     };
//     primaryEmotion: string;
//     confidence: number; // Confidence in the primary emotion
//     // Add other potentially useful features if needed
//     // boundingBox?: any;
//     // landmarks?: any;
// }

// // Helper to map Vision API likelihood strings/enums to numerical scores
// const likelihoodToScore = (likelihood: protos.google.cloud.vision.v1.Likelihood | "UNKNOWN" | null | undefined | string): number => {
//     const likelihoodString = typeof likelihood === 'string' ? likelihood : null;

//     switch (likelihoodString) {
//         case 'VERY_LIKELY': return 0.9;
//         case 'LIKELY': return 0.7;
//         case 'POSSIBLE': return 0.5;
//         case 'UNLIKELY': return 0.3;
//         case 'VERY_UNLIKELY': return 0.1;
//         case 'UNKNOWN':
//         default: return 0;
//     }
// };

// /**
//  * Analyzes a single image for face detection and emotion likelihood using Cloud Vision AI.
//  * Expects image data as a base64 encoded string.
//  */
// export const analyzeFaceEmotion = functions.https.onCall(async (data: any, context: functions.https.CallableContext): Promise<VisionAnalysisResult> => {
//     // 1. Ensure user is authenticated
//     if (!context.auth) {
//         throw new functions.https.HttpsError("unauthenticated", "User must be logged in to analyze images.");
//     }

//     // 2. Get image data from the client request
//     const imageBytes = data.imageBytes; // Expecting base64 encoded image string (without data:image/... prefix)

//     // Validate required input
//     if (!imageBytes) {
//         throw new functions.https.HttpsError("invalid-argument", "Missing image data (expected base64 string).");
//     }

//     // --- Prepare the Vision API request FOR annotateImage ---
//     const request = {
//         image: {
//             content: imageBytes,
//         },
//         // Specify ONLY the features needed within the features array
//         features: [{ type: 'FACE_DETECTION' as const }],
//     };
//     // --- End Request Prep ---

//     try {
//         console.log(`Vision AI: Analyzing face emotion for user ${context.auth.uid}...`);

//         // *** USE annotateImage INSTEAD of faceDetection ***
//         const [result] = await visionClient.annotateImage(request);
//         // *** END CHANGE ***

//         // AnnotateImage returns faceAnnotations in the same way
//         const faces = result.faceAnnotations;

//         // Default result if no face is detected
//         const defaultResult: VisionAnalysisResult = {
//             faceDetected: false,
//             emotions: { joy: 0, sorrow: 0, anger: 0, surprise: 0 },
//             primaryEmotion: 'neutral',
//             confidence: 0,
//         };

//         if (!faces || faces.length === 0) {
//             console.log(`Vision AI: No faces detected for user ${context.auth.uid}.`);
//             return defaultResult;
//         }

//         // Process the first detected face (usually the most prominent)
//         const face = faces[0];

//         // 5. Map likelihoods to scores
//         const emotions = {
//             joy: likelihoodToScore(face.joyLikelihood),
//             sorrow: likelihoodToScore(face.sorrowLikelihood),
//             anger: likelihoodToScore(face.angerLikelihood),
//             surprise: likelihoodToScore(face.surpriseLikelihood),
//             // Note: Vision API doesn't explicitly return Fear or Disgust likelihoods via faceDetection
//         };

//         // Determine primary emotion and its confidence
//         let primaryEmotion = 'neutral';
//         let maxScore = 0.1; // Set a small threshold to overcome default 0s

//         Object.entries(emotions).forEach(([emotion, score]) => {
//             if (score > maxScore) {
//                 maxScore = score;
//                 primaryEmotion = emotion;
//             }
//         });

//         console.log(`Vision AI: Analysis successful for user ${context.auth.uid}. Primary: ${primaryEmotion}, Confidence: ${maxScore.toFixed(2)}`);

//         // 6. Return the processed result
//         return {
//             faceDetected: true,
//             emotions: emotions,
//             primaryEmotion: primaryEmotion,
//             confidence: maxScore,
//             // boundingBox: face.boundingPoly, // Optionally return bounding box
//             // landmarks: face.landmarks,   // Optionally return landmarks
//         };

//     } catch (error: any) {
//         // 7. Handle errors
//         console.error(`Vision AI Error for user ${context.auth.uid}:`, error);
//         const errorMessage = error.message || "Unknown error during face analysis.";
//         // Propagate error appropriately
//         throw new functions.https.HttpsError("internal", `Face analysis failed: ${errorMessage}`, { details: error.details });
//     }
// });


import * as functions from "firebase-functions";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Define the expected output structure (can be the same as before or adapted)
interface VisionAnalysisResult {
    faceDetected: boolean;
    emotions: {
        joy: number;     // Likelihood 0-1
        sorrow: number;  // Likelihood 0-1
        anger: number;   // Likelihood 0-1
        surprise: number;// Likelihood 0-1
        fear?: number;    // Optional: Gemini might provide these
        disgust?: number; // Optional: Gemini might provide these
        neutral?: number; // Optional: Gemini might provide these
    };
    primaryEmotion: string; // The emotion with the highest score
    confidence: number;     // The score of the primary emotion
    // Optional: Add other fields Gemini might provide or you want to infer
    reasoning?: string;     // Gemini might explain its reasoning
}

// --- Gemini Client Initialization ---
const API_KEY = process.env.GEMINI_API_KEY; // Access via process.env
if (!API_KEY) {
    console.error("FATAL ERROR: Gemini API Key not set in function configuration.");
    // Consider throwing an error or using a default key for local testing ONLY
}

// Ensure API_KEY is treated as a string, even if potentially undefined initially
const genAI = new GoogleGenerativeAI(API_KEY || "YOUR_API_KEY_FOR_LOCAL_TESTING_ONLY");

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro", // Or "gemini-1.5-pro" / "gemini-2.5-flash"
    // Optional safety settings - adjust as needed
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});
// --- End Gemini Client Initialization ---


// --- Helper Function to convert Base64 Image to GenerativePart ---
function base64ToGenerativePart(imageB64: string, mimeType: string = 'image/jpeg'): { inlineData: { data: string; mimeType: string } } {
    return {
        inlineData: {
            data: imageB64,
            mimeType,
        },
    };
}


/**
 * Analyzes a single image for face detection and emotion likelihood using Gemini.
 * Expects image data as a base64 encoded string.
 */
export const analyzeFaceEmotion = functions.https.onCall(async (data: any, context: functions.https.CallableContext): Promise<VisionAnalysisResult> => {
    // 1. Ensure user is authenticated (keep this check)
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to analyze images.");
    }

    // 2. Get image data from the client request
    const imageBase64 = data.imageBytes; // Expecting base64 encoded image string

    // Validate required input
    if (!imageBase64) {
        throw new functions.https.HttpsError("invalid-argument", "Missing image data (expected base64 string).");
    }

    // --- Prepare the Gemini Request ---
    const imagePart = base64ToGenerativePart(imageBase64);

    // --- Define the Prompt ---
    // Instruct Gemini to act as an expert and return JSON
    const prompt = `
        Analyze the facial expression in the provided image.
        Determine the likelihood (0.0 to 1.0) for the following emotions: joy, sorrow, anger, surprise, fear, disgust, neutral.
        Identify the primary emotion (the one with the highest likelihood).
        Provide a confidence score (the likelihood of the primary emotion).
        Indicate if a face was clearly detected.

        Respond ONLY with a valid JSON object containing the following keys:
        - "faceDetected": boolean
        - "emotions": {{ "joy": number, "sorrow": number, "anger": number, "surprise": number, "fear": number, "disgust": number, "neutral": number }}
        - "primaryEmotion": string (lowercase name of the emotion with the highest score, or "neutral" if none are significant, or "none" if no face)
        - "confidence": number (the score of the primary emotion, 0 if no face)
        - "reasoning": string (optional: a brief explanation if the expression is ambiguous or complex)

        Example response format:
        {{"faceDetected": true, "emotions": {{"joy": 0.1, "sorrow": 0.6, "anger": 0.1, "surprise": 0.05, "fear": 0.1, "disgust": 0.05, "neutral": 0.1}}, "primaryEmotion": "sorrow", "confidence": 0.6, "reasoning": "Downturned mouth and slightly furrowed brow suggest sadness."}}

        If no face is clearly visible, return:
        {{"faceDetected": false, "emotions": {{"joy": 0, "sorrow": 0, "anger": 0, "surprise": 0, "fear": 0, "disgust": 0, "neutral": 0}}, "primaryEmotion": "none", "confidence": 0, "reasoning": "No clear face detected in the image."}}
    `;
    // --- End Prompt Definition ---

    try {
        console.log(`Gemini: Analyzing face emotion for user ${context.auth.uid}...`);

        // *** Call Gemini API ***
        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const responseText = response.text();

        console.log(`Gemini Raw Response for user ${context.auth.uid}: ${responseText}`);

        // --- Parse the JSON Response ---
        let analysisResult: VisionAnalysisResult;
        try {
            // Clean potential markdown code fences ```json ... ```
            const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, "").trim();
            const parsedJson = JSON.parse(cleanedText);

            // Basic validation
            if (!parsedJson || typeof parsedJson.faceDetected !== 'boolean' || !parsedJson.emotions) {
                throw new Error("Parsed JSON is missing required fields.");
            }

            // Ensure primary emotion and confidence match the emotions map
            let primaryEmotion = parsedJson.primaryEmotion || 'neutral';
            let maxScore = 0;

            if (parsedJson.faceDetected && parsedJson.emotions) {
                 Object.entries(parsedJson.emotions).forEach(([emotion, score]) => {
                    if (typeof score === 'number' && score > maxScore) {
                        maxScore = score;
                        primaryEmotion = emotion;
                    }
                });
                // If scores are all very low, default to neutral
                if (maxScore < 0.1) primaryEmotion = 'neutral'; 
            } else {
                primaryEmotion = 'none';
                maxScore = 0;
            }


            analysisResult = {
                faceDetected: parsedJson.faceDetected,
                emotions: parsedJson.emotions, // Assume Gemini returns all requested keys
                primaryEmotion: primaryEmotion, // Use derived primary emotion
                confidence: maxScore,           // Use derived max score
                reasoning: parsedJson.reasoning || undefined, // Include reasoning if provided
            };

        } catch (parseError: any) {
            console.error(`Gemini Response Parse Error for user ${context.auth.uid}:`, parseError);
            console.error("Problematic Text:", responseText);
            // Fallback: Try to extract *something* or return a default error state
            throw new functions.https.HttpsError("internal", `Failed to parse Gemini response: ${parseError.message}`, { details: responseText });
        }
        // --- End JSON Parsing ---

        console.log(`Gemini: Analysis successful for user ${context.auth.uid}. Primary: ${analysisResult.primaryEmotion}, Confidence: ${analysisResult.confidence.toFixed(2)}`);
        return analysisResult;

    } catch (error: any) {
        console.error(`Gemini API Error for user ${context.auth.uid}:`, error);
        let errorMessage = "Unknown error during Gemini face analysis.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        // Check for specific Gemini blocking reasons if available
        if (error.response && error.response.promptFeedback) {
             console.error('Gemini Prompt Feedback:', error.response.promptFeedback);
             errorMessage += ` (Safety feedback: ${JSON.stringify(error.response.promptFeedback)})`;
        }

        throw new functions.https.HttpsError("internal", `Gemini face analysis failed: ${errorMessage}`, { details: error });
    }
});

// Important: Ensure you also update 'functions/src/index.ts'
// to correctly export this modified 'analyzeFaceEmotion' function.