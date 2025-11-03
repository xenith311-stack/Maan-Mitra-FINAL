import { useState, useEffect, useRef } from 'react';

import { Mic, MicOff, Play, RotateCcw, Heart, CheckCircle, ArrowRight, Home } from 'lucide-react';
// Removed voiceAnalysis import - now using unified STT approach
import { AVAILABLE_VOICES, type VoiceOption } from '../services/speechServices';
// Local VoiceAnalysisResult interface for therapy processing
interface VoiceAnalysisResult {
  transcript: string;
  confidence: number;
  language: string;
  emotionalIndicators: {
    tone: 'calm' | 'stressed' | 'sad' | 'anxious' | 'happy' | 'angry' | 'neutral';
    intensity: number;
    valence: number;
    arousal: number;
    speechRate: 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
    volume: 'whisper' | 'quiet' | 'normal' | 'loud' | 'shouting';
    pitch: 'very_low' | 'low' | 'normal' | 'high' | 'very_high';
  };
  linguisticFeatures: {
    wordCount: number;
    sentimentScore: number;
    complexityScore: number;
    hesitationMarkers: number;
    fillerWords: number;
    emotionalWords: string[];
    culturalExpressions: string[];
  };
  mentalHealthIndicators: {
    stressLevel: number;
    depressionIndicators: string[];
    anxietyIndicators: string[];
    cognitiveLoad: number;
    emotionalRegulation: number;
  };
  culturalContext: {
    languageMixing: number;
    culturalReferences: string[];
    formalityLevel: number;
    respectMarkers: string[];
  };
  recommendations: {
    immediate: string[];
    therapeutic: string[];
    communication: string[];
  };
}
import { useAuth } from './auth/AuthProvider';
import { firebaseService } from '../services/firebaseService';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { toast } from 'sonner';

interface TherapyExercise {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  scenarios: TherapyScenario[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'breathing' | 'grounding' | 'affirmation' | 'mindfulness' | 'expression' | 'interactive';
  icon: string;
  color: string;
  preview: string;
  isUserControlled: boolean;
}

interface TherapyScenario {
  id: string;
  title: string;
  description: string;
  steps: InteractiveStep[];
}

// Define types for multilingual strings
type LangString = {
  [key: string]: string; // e.g., { en: "Hello", hi: "नमस्ते", mr: "नमस्कार" }
};

type LangStringArray = {
  [key: string]: string[]; // e.g., { en: ["Great!"], hi: ["बढ़िया!"] }
};

interface InteractiveStep {
  id: string;
  type: 'choice' | 'voice' | 'breathing' | 'reflection' | 'challenge';
  title: LangString;
  instruction: LangString;
  voiceGuide: LangString;
  choices?: Choice[];
  expectedResponse?: LangString;
  feedback: {
    positive: LangStringArray;
    encouraging: LangStringArray;
    guidance: LangStringArray;
  };
  duration?: number;
  points?: number;
}

interface Choice {
  id: string;
  text: LangString;
  emoji: string;
  response: LangString;
  nextStep?: string;
  points: number;
}

interface VoiceSession {
  id: string;
  startTime: Date;
  exercise: TherapyExercise;
  scenario: TherapyScenario;
  currentStep: number;
  progress: number;
  voiceAnalysis: VoiceAnalysisResult[];
  userChoices: string[];
  points: number;
  achievements: string[];
  completed: boolean;
  mood: 'excited' | 'calm' | 'focused' | 'reflective';
  selectedVoice: any;
  isUserControlled: boolean;
}

const THERAPY_EXERCISES: TherapyExercise[] = [
  {
    id: 'confidence-builder',
    title: 'Confidence Builder',
    subtitle: 'Unlock your inner strength',
    description: 'Interactive challenges to build unshakeable confidence through voice',
    benefits: ['Builds self-confidence', 'Improves public speaking', 'Reduces social anxiety'],
    difficulty: 'intermediate',
    type: 'interactive',
    icon: '🦁',
    color: 'from-yellow-400 to-orange-500',
    preview: 'Face your fears and speak with power!',
    isUserControlled: true,
    scenarios: [
      {
        id: 'power-voice',
        title: 'Find Your Power Voice',
        description: 'Discover the voice that commands respect',
        steps: []
      }
    ]
  },
  {
    id: 'anxiety-warrior',
    title: 'Anxiety Warrior',
    subtitle: 'Conquer your fears',
    description: 'Battle anxiety with interactive voice techniques and real-time feedback',
    benefits: ['Reduces anxiety attacks', 'Builds coping skills', 'Increases resilience'],
    difficulty: 'beginner',
    type: 'interactive',
    icon: '🛡️',
    color: 'from-blue-500 to-purple-600',
    preview: 'Transform anxiety into your superpower!',
    isUserControlled: true,
    scenarios: [
      {
        id: 'calm-warrior',
        title: 'Become the Calm Warrior',
        description: 'Learn to face anxiety with strength and grace',
        steps: []
      }
    ]
  },
  {
    id: 'emotion-explorer',
    title: 'Emotion Explorer',
    subtitle: 'Navigate your inner world',
    description: 'Interactive journey through your emotions with personalized guidance',
    benefits: ['Emotional intelligence', 'Self-awareness', 'Better relationships'],
    difficulty: 'intermediate',
    type: 'interactive',
    icon: '🧭',
    color: 'from-pink-400 to-rose-500',
    preview: 'Discover the wisdom in every emotion!',
    isUserControlled: true,
    scenarios: [
      {
        id: 'emotion-map',
        title: 'Map Your Emotional Landscape',
        description: 'Explore and understand your current emotional state',
        steps: []
      }
    ]
  },
  {
    id: 'stress-buster',
    title: 'Stress Buster',
    subtitle: 'Demolish stress with your voice',
    description: 'High-energy interactive session to blast away stress and tension',
    benefits: ['Instant stress relief', 'Energy boost', 'Mental clarity'],
    difficulty: 'beginner',
    type: 'interactive',
    icon: '💥',
    color: 'from-red-400 to-pink-500',
    preview: 'Unleash your voice to shatter stress!',
    isUserControlled: true,
    scenarios: [
      {
        id: 'stress-destroyer',
        title: 'Become a Stress Destroyer',
        description: 'Use your voice as a powerful stress-busting tool',
        steps: []
      }
    ]
  }
];

// Chat functionality removed - use /companion route for AI chat

export default function VoiceTherapy() {
  const { userProfile, currentUser } = useAuth(); // Get user profile for language preferences

  // Language Helper Function
  const getLangKey = (voice: VoiceOption): string => {
    const lang = voice.language.split('-')[0] || 'en'; // 'hi-IN' -> 'hi', 'en-GB' -> 'en'
    return lang; // Returns 'en', 'hi', 'mr', 'bn', etc.
  };

  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<TherapyScenario | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [voiceAnalysisResults, setVoiceAnalysisResults] = useState<VoiceAnalysisResult[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [showChoices, setShowChoices] = useState(false);
  const [waitingForVoice, setWaitingForVoice] = useState(false);
  const [celebrationMode, setCelebrationMode] = useState(false);
  // Initialize selectedVoice from user preferences or default
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(() => {
    const savedVoiceURI = userProfile?.preferences?.selectedVoice;
    if (savedVoiceURI) {
      const savedVoice = AVAILABLE_VOICES.find(v => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
      if (savedVoice) return savedVoice;
    }
    return AVAILABLE_VOICES[0]!;
  });
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [inputValue, setInputValue] = useState<string>('');
  // ADD THIS
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [currentStep, setCurrentStep] = useState<any | null>(null); // This will hold the AI-generated step

  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Voice therapy session initialization

  // Save voice preference to user profile
  const saveVoicePreference = async (voice: VoiceOption) => {
    if (!currentUser) return;

    try {
      await firebaseService.updateUserProfile(currentUser.uid, {
        preferences: {
          language: userProfile?.preferences?.language || 'mixed',
          culturalBackground: userProfile?.preferences?.culturalBackground || '',
          communicationStyle: userProfile?.preferences?.communicationStyle || 'casual',
          interests: userProfile?.preferences?.interests || [],
          comfortEnvironment: userProfile?.preferences?.comfortEnvironment || '',
          avatarStyle: userProfile?.preferences?.avatarStyle || '',
          notificationsEnabled: userProfile?.preferences?.notificationsEnabled || true,
          ...userProfile?.preferences,
          selectedVoice: voice.voiceURI || voice.name
        }
      });
      console.log('Voice preference saved:', voice.name);
    } catch (error) {
      console.error('Failed to save voice preference:', error);
      toast.error('Failed to save voice preference');
    }
  };

  // Utility functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNextRecommendedExercise = () => {
    if (!currentSession) return 'Confidence Builder';

    const currentId = currentSession.exercise.id;
    const recommendations = {
      'confidence-builder': 'Anxiety Warrior',
      'anxiety-warrior': 'Emotion Explorer',
      'emotion-explorer': 'Stress Buster',
      'stress-buster': 'Confidence Builder'
    };

    return recommendations[currentId as keyof typeof recommendations] || 'Confidence Builder';
  };

  const getPersonalizedStrength = () => {
    if (!currentSession) return 'Great participation';

    if (currentSession.points >= 150) {
      return 'Exceptional voice confidence and engagement';
    } else if (currentSession.points >= 100) {
      return 'Strong voice presence and good participation';
    } else if (currentSession.voiceAnalysis.length >= 2) {
      return 'Willingness to use your voice courageously';
    } else {
      return 'Commitment to personal growth and self-improvement';
    }
  };

  // Session timer
  useEffect(() => {
    if (isActive && currentSession) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isActive, currentSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      // Cleanup MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Stop any playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
    };
  }, []);

  // Replace your existing startSession
  const startSession = async (exercise: TherapyExercise, scenario: TherapyScenario) => {
    console.log('Starting dynamic session for:', exercise.title);
    const session: VoiceSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      exercise,
      scenario, // We still pass the *idea* of the scenario
      currentStep: 0,
      progress: 0,
      voiceAnalysis: [],
      userChoices: [],
      points: 0,
      achievements: [],
      completed: false,
      mood: 'excited',
      selectedVoice,
      isUserControlled: exercise.isUserControlled,
    };

    setCurrentSession(session);
    setSelectedScenario(scenario); // Keep this for context
    setIsActive(true);
    setSessionTime(0);
    setConversationHistory([]); // Reset history
    setCurrentStep(null); // Clear current step
    setShowCompletion(false);

    // --- NEW: Log session start activity ---
    if (currentUser) {
      try {
        await firebaseService.logUserActivity(
          currentUser.uid,
          'started_voice_session',
          {
            exercise: exercise.title,
            exerciseType: exercise.type,
            scenario: scenario.title,
            difficulty: exercise.difficulty
          }
        );
      } catch (error) {
        console.warn('Failed to log session start activity:', error);
      }
    }
    // --- END NEW ---

    // --- NEW: Call the AI Engine to get the FIRST step ---
    try {
      await advanceSession(session, { type: 'start' });
    } catch (error) {
      console.error("Failed to start session:", error);
      toast.error("Could not start AI session. Please try again.");
      resetSession();
    }
  };

  // Add this new function to your component
  const advanceSession = async (session: VoiceSession, userInput: any) => {
    if (!session) return;

    // 1. Add user input to history (if it's not the start)
    let newHistory = [...conversationHistory];
    if (userInput.type !== 'start') {
      newHistory.push({ role: 'user', content: userInput.value });
    }

    // 2. Call the backend "brain"
    try {
      const result = await advanceTherapySession({
        exercise: { id: session.exercise.id, title: session.exercise.title },
        scenario: { id: session.scenario.id, title: session.scenario.title },
        history: newHistory,
        lastUserInput: userInput,
      });

      const { nextStep } = result.data as any;

      // 3. Add AI response to history
      newHistory.push({ role: 'model', content: nextStep.voiceGuide });
      setConversationHistory(newHistory);
      setCurrentStep(nextStep); // <-- This triggers the UI update

      // 4. Update UI based on AI response
      setWaitingForVoice(false);
      setShowChoices(false);
      setCurrentFeedback('');

      // 5. Speak the AI's response
      if (autoPlayVoice && !isPaused) {
        await speakText(nextStep.voiceGuide, selectedVoice);
      }

      // 6. Set up UI for next user input
      if (nextStep.type === 'choice') {
        setShowChoices(true);
      } else if (nextStep.type === 'voice') {
        setWaitingForVoice(true);
      } else if (nextStep.type === 'complete') {
        await completeSession();
      }

      // 7. Update session state
      setCurrentSession(prev => prev ? ({
        ...prev,
        points: prev.points + (nextStep.points || 0),
        currentStep: prev.currentStep + 1,
        progress: Math.min(95, prev.progress + 10), // Update progress
      }) : null);

    } catch (error: any) {
      console.error("Error advancing session:", error);
      toast.error(`AI Error: ${error.message || 'Could not get next step.'}`);
    }
  };









  const completeSession = async () => {
    console.log('Completing session');

    // Clear all timers
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setIsActive(false);
    stopListening();

    if (currentSession) {
      // Calculate achievements based on performance
      const achievements: string[] = [];
      if (currentSession.points >= 100) achievements.push('🏆 Point Master');
      if (currentSession.points >= 150) achievements.push('⭐ Superstar');
      if (currentSession.voiceAnalysis.length >= 2) achievements.push('🎤 Voice Champion');
      if (currentSession.userChoices.length >= 2) achievements.push('🎯 Decision Maker');
      if (sessionTime >= 300) achievements.push('⏰ Dedicated Practitioner');
      achievements.push('✨ Session Complete');

      const completedSession = {
        ...currentSession,
        completed: true,
        progress: 100,
        achievements
      };
      setCurrentSession(completedSession);

      // Save session to Firestore
      if (currentUser) {
        try {
          const sessionData = {
            userId: currentUser.uid,
            startTime: new Date(Date.now() - sessionTime * 1000), // Calculate start time
            endTime: new Date(),
            duration: sessionTime,
            sessionType: 'voice' as const,
            progressMetrics: {
              emotionalRegulation: Math.min(100, currentSession.points / 2) / 100,
              selfAwareness: Math.min(100, currentSession.voiceAnalysis.length * 25) / 100,
              copingSkillsUsage: Math.min(100, currentSession.userChoices.length * 30) / 100,
              therapeuticAlliance: 0.8, // Default good alliance for voice therapy
              engagementLevel: Math.min(100, sessionTime / 180) / 100 // Based on time spent
            },
            outcomes: {
              overallMood: currentSession.points >= 100 ? 'improved' as const : 'stable' as const,
              goalsAddressed: [currentSession.exercise.title],
              skillsPracticed: [currentSession.exercise.type],
              insightsGained: achievements
            }
          };

          await firebaseService.saveSession(sessionData);
          toast.success('Session saved successfully!');
          console.log('Voice therapy session saved to Firestore');

          // --- NEW: Log this activity ---
          await firebaseService.logUserActivity(
            currentUser.uid,
            'completed_voice_session',
            {
              exercise: completedSession.exercise.title,
              points: completedSession.points,
              duration: sessionTime,
              exerciseType: completedSession.exercise.type
            }
          );
          // --- END NEW ---
        } catch (error) {
          console.error('Error saving session:', error);
          toast.error('Failed to save session data');
        }
      }
    }

    // Show completion message
    setShowCompletion(true);
    setCelebrationMode(true);

    try {
      await speakText(
        `Wonderful! You've completed your ${currentSession?.exercise.title} session and earned ${currentSession?.points} points! You took control of your journey and that's amazing!`,
        selectedVoice
      );
    } catch (error) {
      console.warn('Completion voice failed:', error);
    }
  };

  const resetSession = () => {
    // Clear all timers
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);

    // Stop any ongoing voice activities
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Reset all state
    setCurrentSession(null);
    setSelectedScenario(null);
    setIsActive(false);
    setIsListening(false);
    setIsPlaying(false);
    setSessionTime(0);
    setStepProgress(0);
    setVoiceAnalysisResults([]);
    setShowCompletion(false);
    setUserFeedback('');
    setCurrentFeedback('');
    setShowChoices(false);
    setWaitingForVoice(false);
    setCelebrationMode(false);
    setShowSettings(false);
  };









  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64 || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Initialize Firebase functions
  const functions = getFunctions();
  const transcribeAudio = httpsCallable(functions, 'transcribeAudio');
  const synthesizeSpeech = httpsCallable<{ text: string; languageCode?: string; voiceName?: string; speakingRate?: number; pitch?: number; }, { audioBase64: string }>(functions, 'synthesizeSpeech');
  // ADD THIS NEW FUNCTION
  const advanceTherapySession = httpsCallable(functions, 'advanceTherapySession');

  // --- Function to play Base64 Audio using Web Audio API ---
  const playBase64Audio = async (base64String: string) => {
    try {
      // Ensure AudioContext is available
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      // Resume AudioContext if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Stop any currently playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      // Decode the Base64 string to ArrayBuffer
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

      // Create an AudioBufferSourceNode
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Play the audio
      setIsPlaying(true);
      source.start(0);
      audioSourceRef.current = source;

      // Handle end of playback
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
        console.log("Audio playback finished.");
      };
    } catch (error) {
      console.error("Error playing base64 audio:", error);
      toast.error("Failed to play AI voice response.");
      setIsPlaying(false); // Ensure state resets on error
    }
  };

  // --- Stop voice response function ---
  const stopVoiceResponse = () => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop(); // Stop Web Audio playback
        console.log("Audio playback stopped by user.");
      }
      setIsPlaying(false); // Force state update
    } catch (error) {
      console.error("Error stopping audio:", error);
      setIsPlaying(false);
    }
  };

  // --- Unified TTS function (FIXED) ---
  const speakText = async (text: string, voiceOption?: VoiceOption) => {
    if (!text.trim()) return;

    try {
      setIsPlaying(true);

      const voice = voiceOption || selectedVoice;
      const languageCode = voice.language || 'en-IN';
      const voiceName = voice.voiceURI || voice.name;

      // --- UPDATED: Get speakingRate ---
      const speakingRate = voice.rate || 1.0;
      // --- REMOVED 'pitch' variable ---
      // const pitch = voice.pitch || 0; // <-- THIS LINE IS REMOVED

      console.log(`Calling synthesizeSpeech with voice: ${voiceName}, lang: ${languageCode}, rate: ${speakingRate}`); // <-- REMOVED pitch from log

      const result = await synthesizeSpeech({
        text: text,
        languageCode: languageCode,
        voiceName: voiceName,
        speakingRate: speakingRate,
        // --- REMOVED 'pitch' property ---
        // pitch: pitch // <-- THIS LINE IS REMOVED
      });

      const audioBase64 = result.data.audioBase64;
      if (audioBase64) {
        console.log("Received synthesized audio, attempting playback...");
        await playBase64Audio(audioBase64);
      } else {
        console.warn("Synthesize speech returned no audio data.");
        toast.error("Could not generate audio for this message.");
        setIsPlaying(false);
      }
    } catch (error: any) {
      console.error("Error during TTS call or playback:", error);
      toast.error(`AI Voice failed: ${error.message || 'Could not synthesize speech'}`);
      setIsPlaying(false);
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Explicit microphone permission request
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Stop the stream immediately - we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);

      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('🎤 Microphone access is required for voice therapy. Please enable microphone permissions in your browser settings and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('🎤 No microphone found. Please connect a microphone and try again.');
        } else {
          alert('🎤 Unable to access microphone. Please check your device settings.');
        }
      }
      return false;
    }
  };

  // Chat functionality removed - use /companion route for AI chat

  const startListening = async () => {
    // First, explicitly request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      return;
    }

    // *** Determine Language Codes from the SELECTED VOICE ***
    const sessionLanguage = selectedVoice.language || 'en-IN'; // e.g., 'hi-IN', 'bn-IN', 'en-IN'
    let languageCode = sessionLanguage;
    let alternativeLanguageCodes: string[] = [];

    // Set a logical alternative language.
    // If the selected voice isn't English, add English as a backup.
    // If the selected voice IS English, add Hindi as a backup.
    if (languageCode.startsWith('en')) {
      alternativeLanguageCodes = ['hi-IN'];
    } else {
      alternativeLanguageCodes = ['en-IN'];
    }

    console.log(`STT Language Setup - Selected Voice: ${selectedVoice.name}, Primary: ${languageCode}, Alternatives: [${alternativeLanguageCodes.join(', ')}]`);

    try {
      setIsListening(true);
      setInputValue("Listening...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mimeType = 'audio/webm;codecs=opus';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio for STT...');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop()); // Stop mic

        if (audioBlob.size === 0) {
          setIsListening(false);
          setInputValue("");
          return;
        }

        try {
          setInputValue("Processing voice..."); // Indicate processing
          const audioBase64 = await blobToBase64(audioBlob);

          console.log(`🎤 STT DEBUG: Calling transcribeAudio`);
          console.log(`🎤 Selected Voice: ${selectedVoice.name} (${selectedVoice.language})`);
          console.log(`🎤 Primary Language: ${languageCode}`);
          console.log(`🎤 Alternative Languages: [${alternativeLanguageCodes.join(', ')}]`);

          const result = await transcribeAudio({
            audioBytes: audioBase64,
            languageCode: languageCode,
            alternativeLanguageCodes: alternativeLanguageCodes,
            sampleRateHertz: 48000
          });

          const resultData = result.data as { transcription: string; confidence: number };
          const transcript = resultData.transcription;

          console.log(`🎤 STT RESULT: "${transcript}" (confidence: ${resultData.confidence})`);
          console.log(`🎤 Expected language: ${languageCode}`);

          if (transcript) {
            // NEW: Call the new engine
            if (currentSession) {
              const userInput = {
                type: 'voice',
                value: transcript, // The 'content' for history
                transcript: transcript,
                tone: 'neutral' // TODO: You can add your real tone analysis here
              };
              await advanceSession(currentSession, userInput);
            }
            setInputValue(transcript);
          } else {
            toast.info("Could not understand audio.");
            setInputValue("");
          }
        } catch (sttError: any) {
          console.error("STT Error:", sttError);
          toast.error(`Transcription failed: ${sttError.message || 'Unknown STT error'}`);
          setInputValue("");
        } finally {
          setIsListening(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setInputValue("Listening...");
    } catch (error) {
      console.warn('Voice listening failed:', error);
      setIsListening(false);
      setInputValue("");
      alert('🎤 Voice analysis failed. Please try again or check your microphone settings.');
    }
  };

  const stopListening = () => {
    if (isListening && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // Trigger the onstop handler for transcription
      // The onstop handler will set isListening = false after processing
    } else if (isListening) {
      // Reset listening state if no active recording
      setIsListening(false);
    }
  };



  return (
    <div className="min-h-screen bg-green-100 relative overflow-hidden">
      {/* Mint Green Background */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {!currentSession ? (
        // Exercise Selection Screen
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 md:mb-6">
              <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Voice Therapy</h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Choose a guided voice exercise to improve your emotional well-being and self-expression
            </p>
          </div>

          {/* WORKING VOICE SELECTION */}
          <div style={{
            marginBottom: '24px',
            maxWidth: '1024px',
            margin: '0 auto 24px auto'
          }}>
            <div style={{
              position: 'relative',
              zIndex: 1000,
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '2px solid #c084fc',
              borderRadius: '10px'
            }}
              className="md:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Choose Your AI Companion Voice</h3>
                <button
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                >
                  {showVoiceSelector ? 'Hide' : 'Show'} Voices
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{selectedVoice.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedVoice.name}</p>
                    <p className="text-sm text-gray-600">{selectedVoice.description}</p>
                  </div>
                </div>
                <button
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => {
                    const langKey = getLangKey(selectedVoice);
                    const testMessages = {
                      en: "Hello! I'm your AI companion. I'm here to guide you through your voice therapy journey.",
                      hi: "नमस्ते! मैं आपकi AI साथी हूँ। मैं आपकी आवाज़ चिकित्सा यात्रा में आपका मार्गदर्शन करने के लिए यहाँ हूँ।",
                      mr: "नमस्कार! मी तुमचा AI साथी आहे. मी तुमच्या आवाज थेरपी प्रवासात तुम्हाला मार्गदर्शन करण्यासाठी इथे आहे.",
                      bn: "হ্যালো! আমি আপনার AI সঙ্গী। আমি আপনার ভয়েস থেরাপি যাত্রায় আপনাকে গাইড করতে এখানে আছি।",
                      ta: "வணக்கம்! நான் உங்கள் AI துணை. உங்கள் குரல் சிகிச்சை பயணத்தில் உங்களுக்கு வழிகாட்ட நான் இங்கே இருக்கிறேன்.",
                      te: "హలో! నేను మీ AI సహచరుడిని. మీ వాయిస్ థెరపీ ప్రయాణంలో మీకు మార్గదర్శనం చేయడానికి నేను ఇక్కడ ఉన్నాను.",
                      gu: "હેલો! હું તમારો AI સાથી છું. હું તમારી વૉઇસ થેરાપી જર્નીમાં તમને માર્ગદર્શન આપવા માટે અહીં છું.",
                      kn: "ಹಲೋ! ನಾನು ನಿಮ್ಮ AI ಸಹಚರ. ನಿಮ್ಮ ಧ್ವನಿ ಚಿಕಿತ್ಸೆಯ ಪ್ರಯಾಣದಲ್ಲಿ ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.",
                      ml: "ഹലോ! ഞാൻ നിങ്ങളുടെ AI കൂട്ടാളിയാണ്. നിങ്ങളുടെ വോയ്‌സ് തെറാപ്പി യാത്രയിൽ നിങ്ങളെ നയിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്."
                    };
                    const testMessage = testMessages[langKey] || testMessages['en'];
                    speakText(testMessage, selectedVoice);
                  }}
                >
                  <Play className="w-4 h-4" />
                  Test Voice
                </button>
              </div>

              {showVoiceSelector && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  position: 'relative',
                  zIndex: 1000
                }}>
                  {AVAILABLE_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      style={{
                        padding: '16px',
                        backgroundColor: selectedVoice.id === voice.id ? '#f3e8ff' : '#fff',
                        border: selectedVoice.id === voice.id ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        position: 'relative',
                        zIndex: 1001
                      }}
                      onMouseEnter={(e) => {
                        if (selectedVoice.id !== voice.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedVoice.id !== voice.id) {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      onClick={async () => {
                        console.log('Voice selected:', voice.name);
                        setSelectedVoice(voice);

                        await saveVoicePreference(voice);
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          backgroundColor: voice.gender === 'female' ? '#ec4899' : voice.gender === 'male' ? '#3b82f6' : '#6b7280'
                        }}>
                          {voice.name[0]}
                        </div>
                        <div>
                          <p style={{
                            fontWeight: '500',
                            fontSize: '14px',
                            margin: '0',
                            color: '#111827'
                          }}>{voice.name}</p>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0'
                          }}>{voice.accent} • {voice.personality}</p>
                        </div>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: '#4b5563',
                        margin: '0'
                      }}>{voice.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* WORKING EXERCISE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {THERAPY_EXERCISES.map((exercise) => (
              <div
                key={exercise.id}
                style={{
                  position: 'relative',
                  zIndex: 1000,
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onClick={async () => {
                  console.log('Exercise selected:', exercise.title);
                  if (exercise.scenarios[0]) {
                    await startSession(exercise, exercise.scenarios[0]);
                  }
                }}
              >
                <div className={`h-2 bg-gradient-to-r ${exercise.color}`}></div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{exercise.icon}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{exercise.title}</h3>
                          <p className="text-sm text-gray-500 font-medium">{exercise.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">{exercise.description}</p>

                      {/* Benefits */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Benefits:</h4>
                        <div className="flex flex-wrap gap-2">
                          {exercise.benefits.map((benefit, index) => (
                            <span key={index} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>🎯</span>
                          User-Controlled Pace
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🎤</span>
                          Interactive
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: `linear-gradient(to right, ${exercise.color.includes('yellow') ? '#fbbf24, #f59e0b' : exercise.color.includes('blue') ? '#3b82f6, #8b5cf6' : exercise.color.includes('pink') ? '#ec4899, #f43f5e' : exercise.color.includes('red') ? '#ef4444, #ec4899' : '#3b82f6, #8b5cf6'})`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    onClick={async () => {
                      if (exercise.scenarios[0]) {
                        await startSession(exercise, exercise.scenarios[0]);
                      }
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : showCompletion ? (
        // Enhanced Completion Screen with Results & Suggestions
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px',
          maxWidth: '1024px',
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            zIndex: 1000,
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: '15px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Celebration Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 animate-bounce">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">🎉 Amazing Work!</h2>
              <p className="text-xl text-gray-600">
                You've completed your <span className="font-semibold text-purple-600">{currentSession.exercise.title}</span> session!
              </p>
            </div>

            {/* Achievements */}
            {currentSession.achievements && currentSession.achievements.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Achievements Unlocked</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {currentSession.achievements.map((achievement, index) => (
                    <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border-2 border-yellow-300">
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatTime(sessionTime)}</div>
                <div className="text-sm text-gray-500">Time Invested</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{currentSession.points}</div>
                <div className="text-sm text-gray-500">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{voiceAnalysisResults.length}</div>
                <div className="text-sm text-gray-500">Voice Samples</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{currentSession.currentStep}</div>
                <div className="text-sm text-gray-500">Steps Completed</div>
              </div>
            </div>

            {/* Personalized Suggestions */}
            <div className="mb-8 text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">💡 Your Personalized Suggestions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">🎯 Next Steps</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Practice this exercise daily for best results</li>
                    <li>• Try the {getNextRecommendedExercise()} exercise next</li>
                    <li>• Set a reminder for your next voice therapy session</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">🌟 Your Strengths</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• {getPersonalizedStrength()}</li>
                    <li>• Completed {currentSession.currentStep} AI-generated steps</li>
                    <li>• Showed courage by using your voice</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Reflection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Quick Reflection</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  style={{
                    padding: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'auto',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#22c55e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                  onClick={() => setUserFeedback('I feel more confident and empowered!')}
                >
                  <span style={{ fontSize: '32px' }}>😊</span>
                  <span style={{ fontSize: '14px' }}>Feel Great!</span>
                </button>
                <button
                  style={{
                    padding: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'auto',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                  onClick={() => setUserFeedback('I feel calmer and more centered.')}
                >
                  <span style={{ fontSize: '32px' }}>😌</span>
                  <span style={{ fontSize: '14px' }}>Feel Calm</span>
                </button>
                <button
                  style={{
                    padding: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'auto',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#faf5ff';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                  onClick={() => setUserFeedback('I learned something new about myself.')}
                >
                  <span style={{ fontSize: '32px' }}>🤔</span>
                  <span style={{ fontSize: '14px' }}>Learned</span>
                </button>
              </div>
              {userFeedback && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">"{userFeedback}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={resetSession}
              >
                <RotateCcw className="w-4 h-4" />
                Try Another Exercise
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={resetSession}
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Active Session Screen
        <div className="p-6 max-w-4xl mx-auto min-h-screen">

          {/* BASIC REACT TEST */}
          <div style={{
            backgroundColor: 'lime',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center',
            border: '3px solid black'
          }}>
            <h2 style={{ margin: '0 0 10px 0' }}>REACT EVENT TEST</h2>
            <button
              style={{
                padding: '15px 30px',
                backgroundColor: 'blue',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '18px',
                marginRight: '10px'
              }}
              onClick={() => {
                console.log('BASIC REACT BUTTON CLICKED!');
                alert('React events are working!');
              }}
            >
              BASIC TEST
            </button>

            <button
              style={{
                padding: '15px 30px',
                backgroundColor: 'orange',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
              onClick={() => {
                console.log('STATE UPDATE TEST - isPaused was:', isPaused);
                setIsPaused(!isPaused);
                console.log('STATE UPDATE TEST - isPaused now:', !isPaused);
              }}
            >
              STATE TEST (isPaused: {isPaused.toString()})
            </button>
          </div>
          {/* Emergency test section removed - was interfering with UI */}

          {/* Session Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${currentSession.exercise.color} flex items-center justify-center`}>
                  <span className="text-2xl">{currentSession.exercise.icon}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentSession.exercise.title}</h1>
                  <p className="text-gray-600">{currentSession.exercise.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#fff',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <span>⚙️</span>
                  Settings
                </button>
                <button
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                  onClick={() => completeSession()}
                >
                  <CheckCircle className="w-4 h-4" />
                  Finish & See Results
                </button>
                <button
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#fff',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={resetSession}
                >
                  <Home className="w-4 h-4" />
                  Exit Session
                </button>
              </div>
            </div>

            {/* WORKING SETTINGS PANEL */}
            {showSettings && (
              <div style={{
                position: 'relative',
                zIndex: 1000,
                padding: '24px',
                marginBottom: '24px',
                backgroundColor: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '10px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#333'
                }}>Session Settings</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  {/* WORKING Voice Selection */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>AI Voice</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {AVAILABLE_VOICES.map((voice) => (
                        <button
                          key={voice.id}
                          style={{
                            padding: '12px',
                            backgroundColor: selectedVoice.id === voice.id ? '#dbeafe' : '#fff',
                            border: selectedVoice.id === voice.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            position: 'relative',
                            zIndex: 1001
                          }}
                          onMouseEnter={(e) => {
                            if (selectedVoice.id !== voice.id) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedVoice.id !== voice.id) {
                              e.currentTarget.style.backgroundColor = '#fff';
                            }
                          }}
                          onClick={async () => {
                            console.log('Voice selected in settings:', voice.name);
                            setSelectedVoice(voice);

                            await saveVoicePreference(voice);
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: voice.gender === 'female' ? '#ec4899' : voice.gender === 'male' ? '#3b82f6' : '#6b7280'
                              }}>
                                {voice.name[0]}
                              </div>
                              <div>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  margin: '0',
                                  color: '#111827'
                                }}>{voice.name}</p>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  margin: '0'
                                }}>{voice.personality}</p>
                              </div>
                            </div>
                            <button
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#fff',
                                color: '#6c757d',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                position: 'relative',
                                zIndex: 1002
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Testing voice:', voice.name);
                                const langKey = voice.language.split('-')[0] || 'en';
                                const testMessages = {
                                  en: "Hello! This is how I sound.",
                                  hi: "नमस्ते! मैं इस तरह बोलता हूँ।",
                                  mr: "नमस्कार! मी असा बोलतो.",
                                  bn: "হ্যালো! আমি এভাবে কথা বলি।",
                                  ta: "வணக்கம்! நான் இப்படித்தான் பேசுகிறேன்.",
                                  te: "హలో! నేను ఇలా మాట్లాడతాను.",
                                  gu: "હેલો! હું આ રીતે બોલું છું.",
                                  kn: "ಹಲೋ! ನಾನು ಈ ರೀತಿ ಮಾತನಾಡುತ್ತೇನೆ.",
                                  ml: "ഹലോ! ഞാൻ ഇങ്ങനെയാണ് സംസാരിക്കുന്നത്."
                                };
                                const testMessage = testMessages[langKey] || testMessages['en'];
                                speakText(testMessage, voice);
                              }}
                            >
                              Test
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session Controls */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Controls</label>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600">Current Voice: <span className="font-medium">{selectedVoice.name}</span></p>
                        <p className="text-sm text-gray-600">Session Time: <span className="font-medium">{formatTime(sessionTime)}</span></p>
                        <p className="text-sm text-gray-600">Points Earned: <span className="font-medium text-green-600">{currentSession.points}</span></p>
                      </div>

                      {/* Voice Controls */}
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800 font-medium mb-2">🎤 Voice Controls</p>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id="autoPlay"
                            checked={autoPlayVoice}
                            onChange={(e) => setAutoPlayVoice(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="autoPlay" className="text-xs text-purple-700">Auto-play AI responses</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            style={{
                              padding: '6px 12px',
                              backgroundColor: isPaused ? '#007bff' : '#fff',
                              color: isPaused ? 'white' : '#6c757d',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => setIsPaused(!isPaused)}
                          >
                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                          </button>
                          <button
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#fff',
                              color: '#6c757d',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => {
                              if (currentStep?.voiceGuide) {
                                speakText(currentStep.voiceGuide, selectedVoice);
                              }
                            }}
                          >
                            🔄 Repeat
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">💡 Interactive Session</p>
                        <p className="text-xs text-blue-600">Click options to respond, use voice controls, and move at your own pace. The AI will guide you through each step!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  AI-Powered Session - Step {currentSession.currentStep + 1}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{formatTime(sessionTime)}</span>
                  <span className="text-sm font-medium text-green-600">{currentSession.points} points</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${currentSession.exercise.color} transition-all duration-500`}
                  style={{ width: `${currentSession.progress}%` }}
                ></div>
              </div>
            </div>

            {/* WORKING SESSION CONTROLS */}
            <div style={{
              position: 'relative',
              zIndex: 1000,
              padding: '20px',
              margin: '20px 0',
              backgroundColor: '#f8f9fa',
              border: '2px solid #dee2e6',
              borderRadius: '10px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>Session Controls</h3>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    alert('All buttons are now working!');
                    console.log('Test button clicked - SUCCESS!');
                  }}
                >
                  🧪 Test Button
                </button>

                <button
                  style={{
                    padding: '12px 20px',
                    backgroundColor: isPaused ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    console.log('Pause button clicked, current state:', isPaused);
                    setIsPaused(!isPaused);
                    console.log('isPaused set to:', !isPaused);
                  }}
                >
                  {isPaused ? '▶️ Resume Session' : '⏸️ Pause Session'}
                </button>

                {/* Chat button removed - use /companion route for AI chat */}

                <button
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    console.log('Repeat instructions clicked');
                    if (currentStep?.voiceGuide) {
                      setIsPlaying(true);
                      speakText(currentStep.voiceGuide, selectedVoice)
                        .finally(() => setIsPlaying(false));
                    }
                  }}
                  disabled={isPlaying}
                >
                  🔄 Repeat Instructions
                </button>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <input
                    type="checkbox"
                    checked={autoPlayVoice}
                    onChange={(e) => {
                      console.log('Auto-play toggled:', e.target.checked);
                      setAutoPlayVoice(e.target.checked);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  Auto-play AI
                </label>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: isPaused ? '#fff3cd' : '#d4edda',
                  color: isPaused ? '#856404' : '#155724'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isPaused ? '#ffc107' : '#28a745'
                  }}></div>
                  {isPaused ? 'Paused' : 'Active'}
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
                Status: isPaused={isPaused.toString()}, autoPlayVoice={autoPlayVoice.toString()}
              </div>
            </div>

            {/* Chat functionality removed - use /companion route for AI chat */}
          </div>

          {/* WORKING CURRENT STEP */}
          <div style={{
            position: 'relative',
            zIndex: 1000,
            padding: '32px',
            marginBottom: '24px',
            backgroundColor: '#fff',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {currentStep?.instruction || 'Loading next step...'}
              </h2>

              {/* Step Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - stepProgress / 100)}`}
                    className="text-blue-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-700">{Math.round(stepProgress)}%</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">Voice Guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">Listening</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-600">{isPaused ? 'Paused' : 'Active'}</span>
                </div>
              </div>

              {/* Debug Info */}
              <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <p>Debug: isPaused={isPaused.toString()}, showChoices={showChoices.toString()}, waitingForVoice={waitingForVoice.toString()}</p>
                <p>Current Step: {currentSession.currentStep + 1} | AI-Powered Session</p>
                <p>Points: {currentSession.points}</p>
                <p>🌍 Language: {getLangKey(selectedVoice)} | Voice: {selectedVoice.name} ({selectedVoice.language})</p>
                <p>🎤 Current Step Type: {currentStep?.type || 'None'} | AI Generated: {currentStep ? 'Yes' : 'No'}</p>
              </div>

              {/* WORKING CHOICE BUTTONS */}
              {showChoices && currentSession && selectedScenario && !isPaused && (
                <div style={{
                  position: 'relative',
                  zIndex: 1000,
                  padding: '20px',
                  margin: '20px 0',
                  backgroundColor: '#fff',
                  border: '2px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px', textAlign: 'center' }}>
                    Choose your response:
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    {currentStep?.choices?.map((choice) => (
                      <button
                        key={choice.id}
                        style={{
                          padding: '20px',
                          backgroundColor: '#fff',
                          border: '2px solid #dee2e6',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px',
                          minHeight: '120px',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#6f42c1';
                          e.currentTarget.style.backgroundColor = '#f8f9ff';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => {
                          if (!currentSession) return;

                          const userInput = {
                            type: 'choice',
                            value: choice.text // The 'content' for history
                          };

                          // Hide choices immediately for a snappy feel
                          setShowChoices(false);

                          // Call the new engine
                          advanceSession(currentSession, userInput);
                        }}
                        disabled={isPlaying}
                      >
                        <span style={{ fontSize: '36px' }}>{choice.emoji}</span>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                          {choice.text}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6c757d' }}>+{choice.points} points</span>
                      </button>
                    ))}
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    textAlign: 'center',
                    margin: '0'
                  }}>
                    💡 Click any option above to continue. The AI will respond to your choice!
                  </p>
                </div>
              )}

              {/* Paused State */}
              {isPaused && (
                <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">⏸️</span>
                    <p className="text-lg font-medium text-yellow-800">Session Paused</p>
                    <p className="text-sm text-yellow-600 mb-4">Take your time. Resume when you're ready to continue.</p>
                    <button
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0a800'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
                      onClick={() => setIsPaused(false)}
                    >
                      ▶️ Resume Session
                    </button>
                  </div>
                </div>
              )}

              {/* WORKING VOICE INPUT SECTION */}
              {waitingForVoice && !isPaused && (
                <div style={{
                  position: 'relative',
                  zIndex: 1000,
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  border: '2px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    marginBottom: '16px',
                    backgroundColor: isListening ? '#dc3545' : '#007bff',
                    boxShadow: isListening ? '0 10px 25px rgba(220, 53, 69, 0.3)' : '0 4px 15px rgba(0, 123, 255, 0.2)',
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                  }}>
                    <Mic style={{ width: '40px', height: '40px', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px'
                  }}>
                    {isListening ? '🎤 Listening... Speak now!' : '🎯 Voice Challenge'}
                  </h3>
                  <p style={{
                    color: '#6c757d',
                    marginBottom: '16px',
                    fontSize: '16px'
                  }}>
                    {currentStep?.instruction || 'Express yourself freely and let your voice be heard!'}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    <button
                      style={{
                        padding: '15px 25px',
                        backgroundColor: isListening ? '#dc3545' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: (isPlaying || isPaused) ? 0.5 : 1,
                        position: 'relative',
                        zIndex: 1001
                      }}
                      onClick={() => {
                        console.log('Start Speaking button clicked!');
                        if (isListening) {
                          stopListening();
                        } else {
                          startListening();
                        }
                      }}
                      disabled={isPlaying || isPaused}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-5 h-5" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          Start Speaking
                        </>
                      )}
                    </button>

                    <button
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isPlaying ? 0.5 : 1
                      }}
                      onClick={() => {
                        if (currentStep?.voiceGuide) {
                          speakText(currentStep.voiceGuide, selectedVoice);
                        }
                      }}
                      disabled={isPlaying}
                    >
                      <Play className="w-4 h-4" />
                      Hear Instructions Again
                    </button>
                  </div>

                  {/* Voice Analysis Display */}
                  {voiceAnalysisResults.length > 0 && (
                    <div style={{
                      maxWidth: '500px',
                      margin: '0 auto 16px auto',
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #22c55e',
                      borderRadius: '8px'
                    }}>
                      <p style={{ fontSize: '14px', color: '#15803d', fontWeight: '500', marginBottom: '4px' }}>✅ Last recording:</p>
                      <p style={{ color: '#166534', fontWeight: '500' }}>"{voiceAnalysisResults[voiceAnalysisResults.length - 1]?.transcript}"</p>
                      <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Great job using your voice!</p>
                    </div>
                  )}

                  {/* Rich Voice Analysis Visualization */}
                  {voiceAnalysisResults.length > 0 && (
                    <div style={{
                      maxWidth: '600px',
                      margin: '0 auto 20px auto',
                      padding: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                      {(() => {
                        const latestAnalysis = voiceAnalysisResults[voiceAnalysisResults.length - 1];
                        if (!latestAnalysis) return null;

                        const { emotionalIndicators, mentalHealthIndicators, linguisticFeatures } = latestAnalysis;

                        return (
                          <>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px', textAlign: 'center' }}>
                              🎤 Voice Analysis Insights
                            </h3>

                            {/* Emotional Indicators */}
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Emotional State</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                                <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '18px' }}>
                                    {emotionalIndicators.tone === 'happy' ? '😊' :
                                      emotionalIndicators.tone === 'calm' ? '😌' :
                                        emotionalIndicators.tone === 'stressed' ? '😰' :
                                          emotionalIndicators.tone === 'anxious' ? '😟' :
                                            emotionalIndicators.tone === 'sad' ? '😢' : '😐'}
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#92400e', textTransform: 'capitalize' }}>
                                    {emotionalIndicators.tone}
                                  </div>
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#dbeafe', borderRadius: '6px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                                    {Math.round(emotionalIndicators.intensity * 100)}%
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#3730a3' }}>Intensity</div>
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '6px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534', textTransform: 'capitalize' }}>
                                    {emotionalIndicators.speechRate}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#15803d' }}>Speech Rate</div>
                                </div>
                              </div>
                            </div>

                            {/* Mental Health Indicators */}
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Wellness Indicators</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                                <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Stress Level</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                                      {Math.round(mentalHealthIndicators.stressLevel * 100)}%
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '4px',
                                    backgroundColor: '#fee2e2',
                                    borderRadius: '2px',
                                    marginTop: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${mentalHealthIndicators.stressLevel * 100}%`,
                                      height: '100%',
                                      backgroundColor: mentalHealthIndicators.stressLevel > 0.7 ? '#dc2626' :
                                        mentalHealthIndicators.stressLevel > 0.4 ? '#f59e0b' : '#10b981',
                                      transition: 'width 0.3s ease'
                                    }}></div>
                                  </div>
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', color: '#1e40af' }}>Emotional Regulation</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                                      {Math.round(mentalHealthIndicators.emotionalRegulation * 100)}%
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '4px',
                                    backgroundColor: '#dbeafe',
                                    borderRadius: '2px',
                                    marginTop: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${mentalHealthIndicators.emotionalRegulation * 100}%`,
                                      height: '100%',
                                      backgroundColor: '#2563eb',
                                      transition: 'width 0.3s ease'
                                    }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Linguistic Features */}
                            {linguisticFeatures.emotionalWords.length > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Emotional Expression</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {linguisticFeatures.emotionalWords.slice(0, 5).map((word, index) => (
                                    <span key={index} style={{
                                      padding: '4px 8px',
                                      backgroundColor: '#ecfdf5',
                                      color: '#065f46',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      borderRadius: '12px',
                                      border: '1px solid #a7f3d0'
                                    }}>
                                      {word}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendations */}
                            {latestAnalysis.recommendations.immediate.length > 0 && (
                              <div style={{
                                padding: '12px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '8px',
                                border: '1px solid #bbf7d0'
                              }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#166534', marginBottom: '6px' }}>
                                  💡 Personalized Insights
                                </h4>
                                <p style={{ fontSize: '13px', color: '#15803d', lineHeight: '1.4' }}>
                                  {latestAnalysis.recommendations.immediate[0]}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isPlaying ? 0.5 : 1,
                        position: 'relative',
                        zIndex: 1001
                      }}
                      onClick={() => {
                        console.log('Skip This Step button clicked');
                        if (!currentSession) return;

                        const userInput = {
                          type: 'skip',
                          value: 'User requested to skip this step'
                        };
                        advanceSession(currentSession, userInput);
                      }}
                      disabled={isPlaying}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Skip This Step
                    </button>
                  </div>
                </div>
              )}

              {/* WORKING FEEDBACK DISPLAY */}
              {currentFeedback && (
                <div style={{
                  position: 'relative',
                  zIndex: 1000,
                  padding: '24px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  textAlign: 'center',
                  backgroundColor: celebrationMode ? '#f0f9ff' : '#eff6ff',
                  border: celebrationMode ? '2px solid #22c55e' : '2px solid #3b82f6'
                }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    color: '#333',
                    margin: '0'
                  }}>{currentFeedback}</p>
                  {celebrationMode && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '32px' }}>🎉</span>
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#16a34a'
                      }}>
                        +{currentSession?.points || 0} points!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* WORKING BREATHING EXERCISE */}
              {currentStep?.type === 'breathing' && !showChoices && !waitingForVoice && !isPaused && (
                <div style={{
                  position: 'relative',
                  zIndex: 1000,
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  border: '2px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    marginBottom: '16px',
                    backgroundColor: '#28a745'
                  }}>
                    <span style={{ fontSize: '32px' }}>🫁</span>
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '16px'
                  }}>Breathing Exercise</h3>
                  <p style={{
                    color: '#6c757d',
                    marginBottom: '24px',
                    fontSize: '16px'
                  }}>Take deep, calming breaths at your own pace. Focus on your breathing and let go of any tension.</p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <button
                      style={{
                        padding: '15px 25px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        opacity: isPlaying ? 0.5 : 1,
                        position: 'relative',
                        zIndex: 1001
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                      onClick={() => {
                        console.log('Start Breathing Exercise button clicked!');
                        if (currentStep) {
                          setWaitingForVoice(false);
                          setShowChoices(false);
                          setCelebrationMode(true);

                          if (currentSession) {
                            const updatedSession = {
                              ...currentSession,
                              points: currentSession.points + (currentStep.points || 20)
                            };
                            setCurrentSession(updatedSession);
                          }

                          const breathingGuide = "Let's breathe together. Inhale slowly for 4 counts... hold for 4... and exhale for 6. Take your time and breathe at your own pace.";
                          setCurrentFeedback(`${breathingGuide} (+${currentStep.points || 20} points!)`);

                          if (autoPlayVoice) {
                            setIsPlaying(true);
                            speakText(breathingGuide, selectedVoice)
                              .finally(() => setIsPlaying(false));
                          }

                          setCelebrationMode(false);
                        }
                      }}
                      disabled={isPlaying}
                    >
                      🫁 Start Breathing Exercise
                    </button>

                    <button
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#fff',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isPlaying ? 0.5 : 1
                      }}
                      onClick={() => {
                        if (currentStep?.voiceGuide) {
                          setIsPlaying(true);
                          speakText(currentStep.voiceGuide, selectedVoice);
                        }
                      }}
                      disabled={isPlaying}
                    >
                      <Play className="w-4 h-4" />
                      Hear Guidance
                    </button>
                  </div>
                </div>
              )}

              {/* WORKING STEP NAVIGATION */}
              {!showChoices && !waitingForVoice && currentStep?.type !== 'breathing' && !isPaused && (
                <div style={{
                  position: 'relative',
                  zIndex: 1000,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px',
                  padding: '20px',
                  margin: '20px 0'
                }}>
                  {currentFeedback && (
                    <button
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#fff',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        console.log('Clear Feedback button clicked');
                        setCurrentFeedback('');
                      }}
                    >
                      Clear Feedback
                    </button>
                  )}
                  <button
                    style={{
                      padding: '15px 25px',
                      background: 'linear-gradient(to right, #007bff, #6f42c1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      console.log('Next Step button clicked');

                      if (!currentSession) {
                        console.log('Cannot proceed: missing session');
                        return;
                      }

                      const userInput = {
                        type: 'continue',
                        value: 'User requested next step'
                      };
                      advanceSession(currentSession, userInput);
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next Step
                  </button>
                  <button
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#fff',
                      color: '#28a745',
                      border: '2px solid #28a745',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      console.log('Finish Now button clicked');

                      setIsActive(false);

                      if (currentSession) {
                        // Calculate achievements
                        const achievements: string[] = [];
                        if (currentSession.points >= 100) achievements.push('🏆 Point Master');
                        if (currentSession.points >= 150) achievements.push('⭐ Superstar');
                        if (currentSession.voiceAnalysis.length >= 2) achievements.push('🎤 Voice Champion');
                        if (currentSession.userChoices.length >= 2) achievements.push('🎯 Decision Maker');
                        if (sessionTime >= 300) achievements.push('⏰ Dedicated Practitioner');
                        achievements.push('✨ Session Complete');

                        const completedSession = {
                          ...currentSession,
                          completed: true,
                          progress: 100,
                          achievements
                        };
                        setCurrentSession(completedSession);
                      }

                      setShowCompletion(true);
                      setCelebrationMode(true);

                      if (autoPlayVoice) {
                        speakText(
                          `Wonderful! You've completed your session and earned ${currentSession?.points || 0} points! You took control of your journey and that's amazing!`,
                          selectedVoice
                        );
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finish Now
                  </button>
                </div>
              )}

              {/* WORKING CONTINUE BUTTON */}
              {(showChoices || waitingForVoice || currentStep?.type === 'breathing') && !isPaused && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '20px',
                  position: 'relative',
                  zIndex: 1000
                }}>
                  <button
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#fff',
                      color: '#6c757d',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      console.log('Continue to Next Step button clicked');

                      if (!currentSession) {
                        console.log('Cannot proceed: missing session');
                        return;
                      }

                      const userInput = {
                        type: 'continue',
                        value: 'User requested to continue to next step'
                      };
                      advanceSession(currentSession, userInput);
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                    Continue to Next Step
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* WORKING RECENT VOICE ANALYSIS */}
          {voiceAnalysisResults.length > 0 && (
            <div style={{
              position: 'relative',
              zIndex: 1000,
              padding: '24px',
              backgroundColor: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Your Voice Journey
              </h3>
              <div className="space-y-3">
                {voiceAnalysisResults.slice(-2).map((result, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {result.emotionalIndicators.tone} tone
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic mb-2">"{result.transcript}"</p>
                    {result.recommendations.immediate.length > 0 && (
                      <p className="text-xs text-blue-600">
                        💡 {result.recommendations.immediate[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}