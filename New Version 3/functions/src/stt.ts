import * as functions from "firebase-functions";
// UPDATED: Import the v2 client
import { SpeechClient } from "@google-cloud/speech";

// Initialize STT Client (v2)
const speechClient = new SpeechClient();

// UPDATED: Get project ID from environment variables
const projectId = process.env.GCLOUD_PROJECT || functions.config().project.id;

/**
 * Transcribes audio data sent from the client using Google Cloud Speech-to-Text (v2)
 * and the Chirp 3 model.
 * Expects audio data as a base64 encoded string.
 */
export const transcribeAudio = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {

    // 1. Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to transcribe audio.");
    }

    // 2. Get audio data and configuration from the client request
    const audioBytes = data.audioBytes; // Expecting base64 encoded audio string
    const languageCode = data.languageCode || 'en-IN'; // Primary language
    const alternativeLanguageCodes = data.alternativeLanguageCodes || []; // e.g., ['hi-IN']

    if (!audioBytes) {
        throw new functions.https.HttpsError("invalid-argument", "Missing audio data (expected base64 string).");
    }

    // 3. Prepare the recognition configuration for v2
    const config = {
        model: 'chirp_3', // Use Google's latest Chirp 3 model
        
        // UPDATED: In v2, language codes are provided as a single array.
        // The first code is the primary.
        languageCodes: [languageCode, ...alternativeLanguageCodes],

        // UPDATED: Features like punctuation are in a 'features' object
        features: {
            enableAutomaticPunctuation: true,
            // enableWordConfidence: true, // This is also available in v2
            
            // Optional: Add speaker diarization, a key Chirp 3 feature
            // diarizationConfig: {
            //     enableSpeakerDiarization: true,
            //     minSpeakerCount: 1,
            //     maxSpeakerCount: 2, 
            // },
        },
        
        // This 'auto' object tells v2 to infer settings from the audio header
        recognitionConfig: {
            autoDecodingConfig: {}, 
        },
    };

    // 4. Construct the full API request for v2
    const request = {
        recognizer: `projects/${projectId}/locations/global/recognizers/_`,
        config: config,
        
        // <-- THE FIX IS HERE
        // The 'content' field expects bytes, not a base64 string.
        // We must convert the string back into a Buffer.
        content: Buffer.from(audioBytes, 'base64'),
    };

    try {
        console.log(`STT (Chirp 3 / v2): Transcribing audio for user ${context.auth.uid}, lang=${languageCode}`);

        // 6. Call the Google Cloud Speech-to-Text API (v2)
        const [response] = await speechClient.recognize(request);

        // 7. Process the response (structure is very similar)
        if (!response.results || response.results.length === 0 || !response.results[0]?.alternatives || response.results[0].alternatives.length === 0) {
            console.warn(`STT: No transcription result found for user ${context.auth.uid}. API response might be empty.`);
            return { transcription: "", confidence: 0 }; 
        }

        const transcription = response.results
            .map((result: any) => result.alternatives![0]!.transcript)
            .join("\n");
        const confidence = response.results[0]?.alternatives![0]!.confidence || 0; 

        console.log(`STT (Chirp 3 / v2): Transcription successful for user ${context.auth.uid}. Confidence: ${confidence.toFixed(2)}, Length: ${transcription?.length}`);

        // 8. Return the result to the client
        return { transcription: transcription || "", confidence: confidence };

    } catch (error: any) {
        // 9. Handle errors
        console.error(`STT (Chirp 3 / v2) Error for user ${context.auth.uid}:`, error);
        const errorMessage = error.message || "Unknown error during speech-to-text processing.";
        const errorCode = error.code === 3 ? "invalid-argument" : "internal"; 
        throw new functions.https.HttpsError(errorCode, `Chirp 3 (v2) speech-to-text processing failed: ${errorMessage}`, { details: error.details });
    }
});