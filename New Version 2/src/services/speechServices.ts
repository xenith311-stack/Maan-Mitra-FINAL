// src/services/speechServices.ts
// --- CLEANED & EXPANDED FILE ---

// This interface defines the structure for a voice option
export interface VoiceOption {
  id: string;
  name: string; // The friendly name (e.g., "Sarah")
  gender: 'male' | 'female' | 'neutral';
  language: string; // The BCP-47 language code (e.g., "en-IN")
  accent: string;
  personality: 'calm' | 'energetic' | 'supportive' | 'professional' | 'friendly';
  description: string;
  voiceURI?: string; // The *actual* Google Cloud voice name (e.g., "en-IN-Wavenet-A")
  pitch: number;
  rate: number;
  volume: number;
}

// This is the complete list of Google Cloud voices your app will use.
// This is now the single source of truth for voices.
export const AVAILABLE_VOICES: VoiceOption[] = [
  // --- English (India) ---
  {
    id: 'sarah-supportive',
    name: 'Sarah',
    gender: 'female',
    language: 'en-IN',
    accent: 'Indian English',
    personality: 'supportive',
    description: 'Warm, caring therapist voice',
    voiceURI: 'en-IN-Wavenet-A', // Female (India)
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'raj-friendly',
    name: 'Raj',
    gender: 'male',
    language: 'en-IN',
    accent: 'Indian English',
    personality: 'friendly',
    description: 'Encouraging friend voice',
    voiceURI: 'en-IN-Wavenet-C', // Male (India)
    pitch: 1.0,
    rate: 1.0,
    volume: 0.8
  },
  // --- Hindi ---
  {
    id: 'priya-professional',
    name: 'Dr. Priya',
    gender: 'female',
    language: 'hi-IN',
    accent: 'Hindi',
    personality: 'professional',
    description: 'Professional therapist voice (Hindi)',
    voiceURI: 'hi-IN-Wavenet-A', // Female (Hindi)
    pitch: 0.9,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'arjun-confident',
    name: 'Arjun',
    gender: 'male',
    language: 'hi-IN',
    accent: 'Hindi',
    personality: 'energetic',
    description: 'Confident motivator voice (Hindi)',
    voiceURI: 'hi-IN-Wavenet-B', // Male (Hindi)
    pitch: 0.9,
    rate: 1.0,
    volume: 0.9
  },
  // --- English (Other Accents) ---
  {
    id: 'alex-calm',
    name: 'Alex',
    gender: 'male',
    language: 'en-GB', // British English
    accent: 'British English',
    personality: 'calm',
    description: 'Soothing, meditative guide',
    voiceURI: 'en-GB-Wavenet-B', // Male (UK)
    pitch: 0.8,
    rate: 0.8,
    volume: 0.7
  },
  {
    id: 'maya-energetic',
    name: 'Maya',
    gender: 'female',
    language: 'en-AU', // Australian English
    accent: 'Australian English',
    personality: 'energetic',
    description: 'Motivational coach voice',
    voiceURI: 'en-AU-Wavenet-A', // Female (Australia)
    pitch: 1.1,
    rate: 1.1,
    volume: 0.9
  },
  // --- NEW: Other Major Indian Languages ---
  {
    id: 'aditi-friendly',
    name: 'Aditi',
    gender: 'female',
    language: 'bn-IN', // Bengali
    accent: 'Bengali',
    personality: 'friendly',
    description: 'Supportive friend (Bengali)',
    voiceURI: 'bn-IN-Wavenet-A', // Female (Bengali)
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'rohan-calm',
    name: 'Rohan',
    gender: 'male',
    language: 'mr-IN', // Marathi
    accent: 'Marathi',
    personality: 'calm',
    description: 'Calm guide (Marathi)',
    voiceURI: 'mr-IN-Wavenet-B', // Male (Marathi)
    pitch: 0.9,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'kavya-supportive',
    name: 'Kavya',
    gender: 'female',
    language: 'ta-IN', // Tamil
    accent: 'Tamil',
    personality: 'supportive',
    description: 'Warm and caring (Tamil)',
    voiceURI: 'ta-IN-Wavenet-A', // Female (Tamil)
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'vikram-energetic',
    name: 'Vikram',
    gender: 'male',
    language: 'te-IN', // Telugu
    accent: 'Telugu',
    personality: 'energetic',
    description: 'Motivational guide (Telugu)',
    voiceURI: 'te-IN-Standard-B', // Male (Telugu - Standard, Wavenet may be limited)
    pitch: 1.0,
    rate: 1.0,
    volume: 0.9
  },
  {
    id: 'advik-supportive',
    name: 'Advik',
    gender: 'male',
    language: 'gu-IN', // Gujarati
    accent: 'Gujarati',
    personality: 'supportive',
    description: 'Calm and supportive (Gujarati)',
    voiceURI: 'gu-IN-Wavenet-B', // Male (Gujarati)
    pitch: 0.9,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'deepa-friendly',
    name: 'Deepa',
    gender: 'female',
    language: 'kn-IN', // Kannada
    accent: 'Kannada',
    personality: 'friendly',
    description: 'Friendly companion (Kannada)',
    voiceURI: 'kn-IN-Wavenet-A', // Female (Kannada)
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'nisha-calm',
    name: 'Nisha',
    gender: 'female',
    language: 'ml-IN', // Malayalam
    accent: 'Malayalam',
    personality: 'calm',
    description: 'Soothing voice (Malayalam)',
    voiceURI: 'ml-IN-Wavenet-A', // Female (Malayalam)
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  }
];

// We no longer export 'voiceAI' or 'speechService' because
// the components now call the backend functions directly.