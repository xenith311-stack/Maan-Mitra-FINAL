import * as functions from "firebase-functions";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";

const ttsClient = new TextToSpeechClient();

// UPDATED: Default voice is now a correct, known Chirp 3 HD voice name
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || "en-IN-Chirp3-HD-Aoede"; // Chirp 3 HD voice
const DEFAULT_TTS_LANGUAGE = process.env.DEFAULT_TTS_LANGUAGE || "en-IN";

console.log(`TTS Config (Chirp 3 HD): Default Voice = ${DEFAULT_TTS_VOICE}, Default Language = ${DEFAULT_TTS_LANGUAGE}`);

export const synthesizeSpeech = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    console.log(`TTS: Received data object: ${JSON.stringify(data)}`);

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const text = data.text;
    const languageCode = data.languageCode || DEFAULT_TTS_LANGUAGE;
    const voiceName = data.voiceName || DEFAULT_TTS_VOICE;
    const speakingRate = data.speakingRate || 1.0; // 1.0 is normal speed
    
    // REMOVED: 'pitch' is no longer accepted from the client or used.
    // const pitch = data.pitch || 0; 

    if (!text) {
        throw new functions.https.HttpsError("invalid-argument", "Missing text to synthesize.");
    }

    // Ensure speakingRate is within valid ranges
    const safeSpeakingRate = Math.max(0.25, Math.min(4.0, speakingRate));
    // REMOVED: safePitch variable is no longer needed.
    // const safePitch = Math.max(-20.0, Math.min(20.0, pitch));

    // Define SSML gender based on voice naming conventions
    let ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.SSML_VOICE_GENDER_UNSPECIFIED;
    
    // Simplified gender detection
    if (voiceName.includes('-Female-') || voiceName.includes('-HD-A') || voiceName.includes('-HD-K') || voiceName.includes('-HD-L') || voiceName.includes('-HD-Z')) {
        ssmlGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE;
    } else if (voiceName.includes('-Male-') || voiceName.includes('-HD-C') || voiceName.includes('-HD-F') || voiceName.includes('-HD-O') || voiceName.includes('-HD-P')) {
        ssmlGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE;
    }

    const request = {
        input: { text: text },
        // Voice Selection Parameters
        voice: {
            languageCode: languageCode,
            name: voiceName,
            ssmlGender: ssmlGender,
        },
        // Audio Configuration Parameters
        audioConfig: {
            audioEncoding: "MP3" as const,
            speakingRate: safeSpeakingRate,
            // REMOVED: 'pitch' parameter is not supported by Chirp 3 HD
            // pitch: safePitch, 
        },
    };

    try {
        console.log(`TTS (Chirp 3 HD): Synthesizing speech for user ${context.auth.uid}, voice=${voiceName}, lang=${languageCode}, rate=${safeSpeakingRate}`);
        const [response] = await ttsClient.synthesizeSpeech(request);

        if (!response.audioContent || !(response.audioContent instanceof Uint8Array)) {
            throw new Error("No valid audio content received from TTS API.");
        }

        console.log(`TTS (Chirp 3 HD): Synthesis successful for user ${context.auth.uid}. Audio size: ${response.audioContent.length} bytes`);

        // Return audio as base64 string
        const audioBase64 = Buffer.from(response.audioContent).toString("base64");
        return { audioBase64: audioBase64 };

    } catch (error: any)
    {
        console.error(`TTS Error for user ${context.auth.uid}:`, error);
        const errorMessage = error.message || "Unknown error during text-to-speech synthesis.";
        
        // Check for common errors
        if (error.code === 3 || error.message.includes('voice')) { // 3 is often INVALID_ARGUMENT
            throw new functions.https.HttpsError("invalid-argument", `Invalid Chirp 3 HD voice configuration: ${voiceName}/${languageCode}. ${errorMessage}`, { details: error.details });
        }
        if (error.message.includes('pitch')) {
             throw new functions.https.HttpsError("invalid-argument", `Pitch is not supported for this Chirp 3 HD voice. ${errorMessage}`, { details: error.details });
        }

        throw new functions.https.HttpsError("internal", `Chirp 3 HD text-to-speech synthesis failed: ${errorMessage}`, { details: error.details });
    }
});