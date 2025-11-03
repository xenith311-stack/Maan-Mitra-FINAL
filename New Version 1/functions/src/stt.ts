import * as functions from "firebase-functions";
import { SpeechClient } from "@google-cloud/speech";

// Initialize STT Client (do this once)
const speechClient = new SpeechClient();

/**
 * Transcribes audio data sent from the client using Google Cloud Speech-to-Text.
 * Expects audio data as a base64 encoded string.
 */
export const transcribeAudio = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    
    // 1. Ensure user is authenticated
    if (!context.auth) {
        // Throwing an HttpsError is important for Волшебник Callable Functions
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to transcribe audio.");
    }

    // 2. Get audio data and configuration from the client request
    const audioBytes = data.audioBytes; // Expecting base64 encoded audio string
    const languageCode = data.languageCode || 'en-IN'; // Default to Indian English, can be overridden by client
    // *** NEW: Get alternative languages from client data ***
    const alternativeLanguageCodes = data.alternativeLanguageCodes || []; // Expect an array, e.g., ['hi-IN']
    const encoding = "WEBM_OPUS" as const; // Assuming client sends WEBM/Opus from MediaRecorder

    // Validate required input
    if (!audioBytes) {
        throw new functions.https.HttpsError("invalid-argument", "Missing audio data (expected base64 string).");
    }

    // 3. Prepare the audio object for the API request
    const audio = {
        content: audioBytes,
    };

    // 4. Prepare the recognition configuration
    // Note: sampleRateHertz is omitted as it's typically included in the WEBM_OPUS header
    const config = {
        encoding: encoding,
        sampleRateHertz: 48000, // Explicitly SET for OPUS header match
        languageCode: languageCode, // Primary language
       // *** ADD alternativeLanguageCodes ***
        alternativeLanguageCodes: alternativeLanguageCodes, // Pass array of secondary codes
        model: 'default', // Using 'default' often works well; other options exist ('telephony', 'latest_long')
        enableAutomaticPunctuation: true,
        // Optional enhancements:
        // enableWordConfidence: true,
        // useEnhanced: true, // May improve accuracy but costs more
    };

    // 5. Construct the full API request
    const request = {
        audio: audio,
        config: config,
    };

    try {
        // Log the request details (excluding potentially large audio content)
        console.log(`STT: Transcribing audio for user ${context.auth.uid}, lang=${languageCode}, encoding=${encoding}, sampleRate=48000 (expected from WEBM_OPUS header)`);

        // 6. Call the Google Cloud Speech-to-Text API
        const [response] = await speechClient.recognize(request);

        // 7. Process the response
        // Check carefully for valid results structure
        if (!response.results || response.results.length === 0 || !response.results[0]?.alternatives || response.results[0].alternatives.length === 0) {
            console.warn(`STT: No transcription result found for user ${context.auth.uid}. API response might be empty.`);
            return { transcription: "", confidence: 0 }; // Return empty string and zero confidence
        }

        // Extract transcription and confidence from the first alternative of the first result
        const transcription = response.results
            .map((result: any) => result.alternatives![0]!.transcript) // Safely map results
            .join("\n"); // Join if multiple results (though usually one for non-streaming)
        const confidence = response.results[0]?.alternatives![0]!.confidence || 0; // Get confidence or default to 0

        console.log(`STT: Transcription successful for user ${context.auth.uid}. Confidence: ${confidence.toFixed(2)}, Length: ${transcription?.length}`);

        // 8. Return the result to the client
        return { transcription: transcription || "", confidence: confidence };

    } catch (error: any) {
        // 9. Handle errors during the API call or processing
        console.error(`STT Error for user ${context.auth.uid}:`, error);
        const errorMessage = error.message || "Unknown error during speech-to-text processing.";
        // Propagate a specific error code if possible, otherwise use 'internal'
        const errorCode = error.code === 3 ? "invalid-argument" : "internal"; // Map gRPC code 3 to HttpsError code
        throw new functions.https.HttpsError(errorCode, `Speech-to-text processing failed: ${errorMessage}`, { details: error.details });
    }
});