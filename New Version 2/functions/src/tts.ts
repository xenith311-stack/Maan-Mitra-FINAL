import * as functions from "firebase-functions";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech"; // Import protos too

const ttsClient = new TextToSpeechClient();

// Use environment variables directly (set via .env files or firebase functions:config:set)
// Ensure these are defined during deployment or in your .env.<project_id> file
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || "en-IN-Wavenet-D"; // Updated default voice
const DEFAULT_TTS_LANGUAGE = process.env.DEFAULT_TTS_LANGUAGE || "en-IN";

// Add Log to check loaded env vars
console.log(`TTS Config: Default Voice = ${DEFAULT_TTS_VOICE}, Default Language = ${DEFAULT_TTS_LANGUAGE}`);

export const synthesizeSpeech = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // --- THIS IS THE NEW DEBUGGING LINE ---
    console.log(`TTS: Received data object: ${JSON.stringify(data)}`);
    // --- END NEW LINE ---

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const text = data.text;
    const languageCode = data.languageCode || DEFAULT_TTS_LANGUAGE;
    const voiceName = data.voiceName || DEFAULT_TTS_VOICE;
    const speakingRate = data.speakingRate || 1.0; // 1.0 is normal speed
    const pitch = data.pitch || 0; // 0 is normal pitch

    if (!text) {
        throw new functions.https.HttpsError("invalid-argument", "Missing text to synthesize.");
    }

    // Ensure speakingRate and pitch are within valid ranges
    const safeSpeakingRate = Math.max(0.25, Math.min(4.0, speakingRate));
    const safePitch = Math.max(-20.0, Math.min(20.0, pitch));

    // Define SSML gender based on voice name convention (optional but can help selection)
    let ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.SSML_VOICE_GENDER_UNSPECIFIED;
    // FEMALE models are -A and -D
    if (voiceName.includes('-Wavenet-A') || voiceName.includes('-Wavenet-D') || voiceName.includes('-Standard-A') || voiceName.includes('-Standard-D')) {
        ssmlGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE;
        // MALE models are -B and -C
    } else if (voiceName.includes('-Wavenet-B') || voiceName.includes('-Wavenet-C') || voiceName.includes('-Standard-B') || voiceName.includes('-Standard-C')) {
        ssmlGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE;
    }

    const request = {
        input: { text: text },
        // Voice Selection Parameters
        voice: {
            languageCode: languageCode,
            name: voiceName,
            ssmlGender: ssmlGender, // Add SSML Gender
        },
        // Audio Configuration Parameters
        audioConfig: {
            audioEncoding: "MP3" as const, // Use MP3 encoding
            speakingRate: safeSpeakingRate,
            pitch: safePitch,
            // Optional: Effects profile for different audio outputs
            // effectsProfileId: ['telephony-class-application'],
        },
    };

    try {
        console.log(`TTS: Synthesizing speech for user ${context.auth.uid}, voice=${voiceName}, lang=${languageCode}, rate=${safeSpeakingRate}, pitch=${safePitch}`);
        const [response] = await ttsClient.synthesizeSpeech(request);

        if (!response.audioContent || !(response.audioContent instanceof Uint8Array)) {
            throw new Error("No valid audio content received from TTS API.");
        }

        console.log(`TTS: Synthesis successful for user ${context.auth.uid}. Audio size: ${response.audioContent.length} bytes`);

        // Return audio as base64 string
        const audioBase64 = Buffer.from(response.audioContent).toString("base64");
        return { audioBase64: audioBase64 };

    } catch (error: any) {
        console.error(`TTS Error for user ${context.auth.uid}:`, error);
        const errorMessage = error.message || "Unknown error during text-to-speech synthesis.";
        // Check for common errors like invalid voice name
        if (error.code === 3 || error.message.includes('voice')) { // 3 is often INVALID_ARGUMENT
            throw new functions.https.HttpsError("invalid-argument", `Invalid TTS voice configuration: ${voiceName}/${languageCode}. ${errorMessage}`, { details: error.details });
        }
        throw new functions.https.HttpsError("internal", `Text-to-speech synthesis failed: ${errorMessage}`, { details: error.details });
    }
});