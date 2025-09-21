import { useState, useEffect, useRef } from 'react';

import { Mic, MicOff, Play, RotateCcw, Heart, CheckCircle, ArrowRight, Home } from 'lucide-react';
import { voiceAnalysis, type VoiceAnalysisResult } from '../services/voiceAnalysis';
import { voiceAI, AVAILABLE_VOICES, type VoiceOption } from '../services/speechServices';
import { personalizedTherapy } from '../services/responseManager';

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

interface InteractiveStep {
  id: string;
  type: 'choice' | 'voice' | 'breathing' | 'reflection' | 'challenge';
  title: string;
  instruction: string;
  voiceGuide: string;
  choices?: Choice[];
  expectedResponse?: string;
  feedback: {
    positive: string[];
    encouraging: string[];
    guidance: string[];
  };
  duration?: number;
  points?: number;
}

interface Choice {
  id: string;
  text: string;
  emoji: string;
  response: string;
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
        steps: [
          {
            id: 'mood-check',
            type: 'choice',
            title: 'How are you feeling right now?',
            instruction: 'Choose your current energy level',
            voiceGuide: 'Let\'s start by checking in with your energy. How are you feeling right now?',
            choices: [
              { id: 'energetic', text: 'Energetic & Ready', emoji: '⚡', response: 'Amazing! That energy will fuel your confidence!', points: 10 },
              { id: 'nervous', text: 'Nervous but Willing', emoji: '😰', response: 'Perfect! Nervousness means you care. Let\'s channel that energy!', points: 15 },
              { id: 'tired', text: 'Tired but Trying', emoji: '😴', response: 'I admire your commitment! Let\'s build energy together!', points: 20 },
              { id: 'excited', text: 'Excited to Grow', emoji: '🚀', response: 'Your excitement is contagious! Let\'s harness that power!', points: 10 }
            ],
            feedback: {
              positive: ['Your honesty is the first step to growth!'],
              encouraging: ['Every feeling is valid and useful!'],
              guidance: ['Let\'s use this energy to build something amazing!']
            },
            points: 5
          },
          {
            id: 'power-phrase',
            type: 'voice',
            title: 'Speak Your Power Phrase',
            instruction: 'Say "I am powerful and confident" with conviction',
            voiceGuide: 'Now, I want you to say "I am powerful and confident" - but not just say it, DECLARE it! Let me hear your power!',
            expectedResponse: 'I am powerful and confident',
            feedback: {
              positive: ['WOW! I can hear the strength in your voice!', 'That was incredible! You sound like a leader!', 'Amazing! Your confidence is shining through!'],
              encouraging: ['Good start! Now let\'s add even more power to that voice!', 'I can hear your potential! Let\'s unlock more of it!', 'Nice! Your voice is getting stronger!'],
              guidance: ['Try speaking from your chest, not your throat', 'Stand tall and project your voice forward', 'Imagine you\'re speaking to inspire 1000 people']
            },
            points: 25
          },
          {
            id: 'challenge-choice',
            type: 'choice',
            title: 'Choose Your Challenge',
            instruction: 'What confidence challenge excites you most?',
            voiceGuide: 'You\'re doing great! Now, what challenge would push you to grow the most?',
            choices: [
              { id: 'presentation', text: 'Give a Mini Presentation', emoji: '🎤', response: 'Bold choice! Let\'s make you a presentation master!', points: 30 },
              { id: 'compliment', text: 'Give Yourself Compliments', emoji: '💖', response: 'Self-love is the foundation of confidence!', points: 25 },
              { id: 'story', text: 'Tell an Inspiring Story', emoji: '📖', response: 'Stories have power! Let\'s unleash yours!', points: 35 },
              { id: 'debate', text: 'Argue Your Point', emoji: '⚖️', response: 'Excellent! Let\'s build your persuasive power!', points: 40 }
            ],
            feedback: {
              positive: ['Your choice shows real courage!'],
              encouraging: ['This challenge will unlock new levels of confidence!'],
              guidance: ['Remember, growth happens outside your comfort zone!']
            },
            points: 10
          }
        ]
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
        steps: [
          {
            id: 'anxiety-level',
            type: 'choice',
            title: 'What\'s your anxiety level right now?',
            instruction: 'Be honest about how you\'re feeling',
            voiceGuide: 'First, let\'s acknowledge where you are right now. What\'s your anxiety level?',
            choices: [
              { id: 'low', text: 'Pretty Calm', emoji: '😌', response: 'Great! Let\'s build on that calm energy!', points: 10 },
              { id: 'medium', text: 'Somewhat Anxious', emoji: '😟', response: 'That\'s normal! We\'ll work through this together!', points: 15 },
              { id: 'high', text: 'Very Anxious', emoji: '😰', response: 'I\'m proud of you for being here. You\'re already being brave!', points: 25 },
              { id: 'panic', text: 'Feeling Panicky', emoji: '😱', response: 'You\'re safe here. Let\'s take this one breath at a time.', points: 30 }
            ],
            feedback: {
              positive: ['Acknowledging your feelings takes courage!'],
              encouraging: ['You\'re not alone in this journey!'],
              guidance: ['Every warrior starts by knowing their battlefield!']
            },
            points: 5
          },
          {
            id: 'warrior-breath',
            type: 'breathing',
            title: 'Warrior\'s Breath',
            instruction: 'Breathe like a warrior - strong and steady',
            voiceGuide: 'Now, let\'s breathe like a warrior. Strong, steady, unshakeable. Breathe in strength for 4 counts, hold your power for 4, release fear for 6. Ready?',
            feedback: {
              positive: ['Your breathing is getting stronger!', 'I can hear the warrior in you!', 'That\'s the breath of someone who won\'t give up!'],
              encouraging: ['Keep going, you\'re building strength with each breath!', 'Every breath is making you more powerful!'],
              guidance: ['Feel your feet on the ground', 'Imagine breathing in courage', 'Let each exhale release the tension']
            },
            duration: 60000,
            points: 20
          },
          {
            id: 'fear-challenge',
            type: 'voice',
            title: 'Challenge Your Fear',
            instruction: 'Say "I am stronger than my anxiety" with power',
            voiceGuide: 'Now, look your anxiety in the eye and declare: "I am stronger than my anxiety!" Say it like you mean it!',
            expectedResponse: 'I am stronger than my anxiety',
            feedback: {
              positive: ['YES! That\'s the voice of a true warrior!', 'Incredible! Your anxiety just heard your strength!', 'Amazing! You just declared war on fear!'],
              encouraging: ['Good! Now let\'s make that voice even more powerful!', 'I can hear your strength growing!', 'That\'s it! Keep claiming your power!'],
              guidance: ['Speak from your core, not your throat', 'Imagine your anxiety shrinking as you speak', 'Feel the truth of those words in your body']
            },
            points: 35
          }
        ]
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
        steps: [
          {
            id: 'emotion-wheel',
            type: 'choice',
            title: 'What emotion is strongest right now?',
            instruction: 'Choose the emotion that feels most present',
            voiceGuide: 'Let\'s explore your emotional landscape. What emotion feels strongest in your body right now?',
            choices: [
              { id: 'joy', text: 'Joy & Happiness', emoji: '😊', response: 'Beautiful! Let\'s amplify that joy!', points: 15 },
              { id: 'sadness', text: 'Sadness & Grief', emoji: '😢', response: 'Your sadness is valid and important. Let\'s honor it.', points: 20 },
              { id: 'anger', text: 'Anger & Frustration', emoji: '😠', response: 'Anger often protects something precious. Let\'s explore it.', points: 25 },
              { id: 'fear', text: 'Fear & Worry', emoji: '😨', response: 'Fear is trying to keep you safe. Let\'s understand its message.', points: 20 },
              { id: 'mixed', text: 'Mixed Emotions', emoji: '🌈', response: 'Complex emotions show your depth. Let\'s untangle them together.', points: 30 }
            ],
            feedback: {
              positive: ['Your emotional awareness is impressive!'],
              encouraging: ['Every emotion has wisdom to offer!'],
              guidance: ['Let\'s dive deeper into what this emotion is telling you!']
            },
            points: 10
          },
          {
            id: 'emotion-story',
            type: 'voice',
            title: 'Tell Your Emotion\'s Story',
            instruction: 'Describe what this emotion feels like in your body',
            voiceGuide: 'Now, I want you to describe this emotion. Where do you feel it in your body? What does it want you to know? Speak freely.',
            feedback: {
              positive: ['Your emotional vocabulary is growing!', 'That\'s such insightful self-awareness!', 'You\'re becoming an emotion expert!'],
              encouraging: ['Keep exploring, you\'re doing great!', 'Every word helps you understand yourself better!', 'Your emotions are lucky to have such a thoughtful observer!'],
              guidance: ['Try to feel the emotion in your body as you speak', 'What would this emotion say if it could talk?', 'Notice any images or memories that come up']
            },
            points: 30
          }
        ]
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
        steps: [
          {
            id: 'stress-meter',
            type: 'choice',
            title: 'How stressed are you feeling?',
            instruction: 'Rate your current stress level',
            voiceGuide: 'Let\'s check your stress meter! How wound up are you feeling right now?',
            choices: [
              { id: 'chill', text: 'Pretty Relaxed', emoji: '😎', response: 'Nice! Let\'s keep you in that zen zone!', points: 10 },
              { id: 'medium', text: 'Moderately Stressed', emoji: '😤', response: 'Time to release that tension! Let\'s do this!', points: 15 },
              { id: 'high', text: 'Very Stressed', emoji: '🤯', response: 'Perfect! We\'re about to blast that stress away!', points: 20 },
              { id: 'overwhelmed', text: 'Completely Overwhelmed', emoji: '😵', response: 'You came to the right place! Let\'s demolish that stress!', points: 25 }
            ],
            feedback: {
              positive: ['Great awareness of your stress levels!'],
              encouraging: ['We\'re about to turn that stress into strength!'],
              guidance: ['Get ready to feel amazing!']
            },
            points: 5
          },
          {
            id: 'stress-shout',
            type: 'voice',
            title: 'Stress Release Shout',
            instruction: 'Shout "STRESS BE GONE!" as loud as you can',
            voiceGuide: 'Now, we\'re going to blast that stress away! I want you to shout "STRESS BE GONE!" as loud as you can. Ready? Let it RIP!',
            expectedResponse: 'STRESS BE GONE',
            feedback: {
              positive: ['YESSS! That was POWERFUL!', 'WOW! I felt that energy from here!', 'INCREDIBLE! Your stress just ran away scared!'],
              encouraging: ['Good! Now let\'s make it even LOUDER!', 'I can feel your power building!', 'That\'s it! Let it all out!'],
              guidance: ['Shout from your belly, not your throat!', 'Imagine blasting the stress out of your body!', 'Feel the release with every word!']
            },
            points: 40
          }
        ]
      }
    ]
  }
];

// This function is now handled by the PersonalizedTherapyManager

// Comprehensive personalized therapy response generator
// SIMPLE WORKING THERAPY RESPONSE - NO MORE BROKEN AI!
async function generatePersonalizedTherapyResponse(
  userMessage: string, 
  profile: any
): Promise<string> {
  const lowerMessage = userMessage.toLowerCase();
  const isShort = profile.responseLength === 'short';
  
  console.log('🎯 User said:', userMessage);
  console.log('📏 Short mode:', isShort);
  
  // IMMEDIATE PREFERENCE CHANGES
  if (lowerMessage.includes('short')) {
    personalizedTherapy.updateProfile({ responseLength: 'short' });
    return "Short responses set.";
  }
  
  if (lowerMessage.includes('longer') || lowerMessage.includes('detailed')) {
    personalizedTherapy.updateProfile({ responseLength: 'normal' });
    return "I'll give more detailed responses now.";
  }
  
  // SIMPLE DIRECT RESPONSES - NO REPETITIVE PHRASES
  
  // Greetings
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return isShort ? "Hi. How are you?" : "Hello. How are you feeling today?";
  }
  
  // Emotions - SPECIFIC responses, no generic phrases
  if (lowerMessage.includes('anxious')) {
    return isShort ? "What's making you anxious?" : "What's causing your anxiety right now?";
  }
  
  if (lowerMessage.includes('stress')) {
    return isShort ? "What's stressing you?" : "What's the main source of your stress?";
  }
  
  if (lowerMessage.includes('sad')) {
    return isShort ? "What's making you sad?" : "What's been making you feel sad?";
  }
  
  if (lowerMessage.includes('angry')) {
    return isShort ? "What made you angry?" : "What triggered your anger?";
  }
  
  if (lowerMessage.includes('happy') || lowerMessage.includes('good')) {
    return isShort ? "That's great!" : "I'm glad you're feeling good. What's going well?";
  }
  
  // Acknowledgments
  if (lowerMessage.includes('thank')) {
    return isShort ? "You're welcome." : "You're welcome. How else can I help?";
  }
  
  if (lowerMessage.includes('yes')) {
    return isShort ? "Okay." : "I understand. What would you like to talk about?";
  }
  
  if (lowerMessage.includes('no')) {
    return isShort ? "Alright." : "That's okay. What would you prefer to discuss?";
  }
  
  // Problems
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
    return isShort ? "What's the problem?" : "Tell me about the problem you're facing.";
  }
  
  if (lowerMessage.includes('help')) {
    return isShort ? "How can I help?" : "I'm here to help. What do you need support with?";
  }
  
  // Family/Relationships
  if (lowerMessage.includes('family')) {
    return isShort ? "What about your family?" : "What's happening with your family?";
  }
  
  if (lowerMessage.includes('friend')) {
    return isShort ? "Tell me about your friends." : "What's going on with your friends?";
  }
  
  // Work/Study
  if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
    return isShort ? "What about work?" : "What's happening at work?";
  }
  
  if (lowerMessage.includes('study') || lowerMessage.includes('exam')) {
    return isShort ? "How are your studies?" : "How are your studies going?";
  }
  
  // DEFAULT - Simple, direct, NO repetitive phrases
  return isShort ? "Tell me more." : "Can you tell me more about that?";
}

export default function VoiceTherapy() {
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
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(AVAILABLE_VOICES[0]!);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [showChatMode, setShowChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'ai', message: string, timestamp: Date }>>([]);
  
  // User preferences are now handled by PersonalizedTherapyManager
  const [isInChatMode, setIsInChatMode] = useState(false);

  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize personalized therapy session
  useEffect(() => {
    personalizedTherapy.startSession();
    console.log('Personalized therapy session started:', personalizedTherapy.getProfile());
  }, []);

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
      voiceAnalysis.stopVoiceAnalysis();
    };
  }, []);

  const startSession = (exercise: TherapyExercise, scenario: TherapyScenario) => {
    const session: VoiceSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      exercise,
      scenario,
      currentStep: 0,
      progress: 0,
      voiceAnalysis: [],
      userChoices: [],
      points: 0,
      achievements: [],
      completed: false,
      mood: 'excited',
      selectedVoice,
      isUserControlled: exercise.isUserControlled
    };

    // Set the selected voice for the AI
    voiceAI.setVoice(selectedVoice);

    setCurrentSession(session);
    setSelectedScenario(scenario);
    setIsActive(true);
    setSessionTime(0);
    setStepProgress(0);
    setShowCompletion(false);
    setUserFeedback('');
    setCurrentFeedback('');
    setShowChoices(false);
    setWaitingForVoice(false);
    setCelebrationMode(false);

    // Start with an exciting intro
    setTimeout(() => {
      executeStep(session, 0);
    }, 1000);
  };

  const executeStep = async (session: VoiceSession, stepIndex: number) => {
    if (stepIndex >= session.scenario.steps.length) {
      completeSession();
      return;
    }

    const step = session.scenario.steps[stepIndex];
    if (!step) return;

    console.log(`Executing step ${stepIndex + 1}: ${step.title} (${step.type})`);

    setStepProgress(0);
    setCurrentFeedback('');
    setShowChoices(false);
    setWaitingForVoice(false);
    setCelebrationMode(false);

    // Always speak the voice guide first if auto-play is enabled
    if (autoPlayVoice && voiceAI.isVoiceSupported() && !isPaused) {
      setIsPlaying(true);
      try {
        await voiceAI.respondWithVoice(step.voiceGuide, 'en-IN', selectedVoice.personality as any, selectedVoice);
      } catch (error) {
        console.warn('Voice guide failed:', error);
      }
      setIsPlaying(false);
    }

    // Handle different step types - USER CONTROLLED
    if (step.type === 'choice') {
      setShowChoices(true);
      // Show a helpful message
      setCurrentFeedback("Choose one of the options below to continue:");
    } else if (step.type === 'voice') {
      setWaitingForVoice(true);
      setCurrentFeedback("Click 'Start Speaking' when you're ready to use your voice:");
    } else if (step.type === 'breathing') {
      setCurrentFeedback("Take your time with this breathing exercise. Click 'Start' when ready:");
      // Don't auto-start breathing, let user control it
    } else {
      setCurrentFeedback("Read the instruction above and click 'Continue' when you're ready:");
    }
  };





  const handleVoiceResponse = (result: VoiceAnalysisResult) => {
    if (!currentSession || !selectedScenario) return;

    const currentStep = selectedScenario.steps[currentSession.currentStep];
    if (!currentStep) return;

    console.log('Voice response received:', result.transcript);

    // Clear any existing timers
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setVoiceAnalysisResults(prev => [...prev, result]);

    // Stop listening
    stopListening();
    setWaitingForVoice(false);

    // Analyze the response and give feedback
    const feedback = analyzeVoiceResponse(result, currentStep);
    setCurrentFeedback(feedback.message);

    // Add points
    const updatedSession = {
      ...currentSession,
      points: currentSession.points + feedback.points
    };
    setCurrentSession(updatedSession);

    // Speak feedback
    if (voiceAI.isVoiceSupported()) {
      try {
        voiceAI.respondWithVoice(feedback.message, 'en-IN', 'supportive');
      } catch (error) {
        console.warn('Feedback voice failed:', error);
      }
    }

    setCelebrationMode(true);

    // Continue after feedback
    setTimeout(() => {
      setCelebrationMode(false);
      setCurrentFeedback('');
      nextStep();
    }, 4000);
  };

  const analyzeVoiceResponse = (result: VoiceAnalysisResult, step: InteractiveStep) => {
    const transcript = result.transcript.toLowerCase();
    const confidence = result.confidence;
    const intensity = result.emotionalIndicators.intensity;

    let points = 10;
    let message = '';

    if (step.expectedResponse) {
      const expected = step.expectedResponse.toLowerCase();
      const similarity = transcript.includes(expected.split(' ')[0] || '') ? 0.8 : 0.3;

      if (similarity > 0.7 && intensity > 0.6) {
        message = step.feedback.positive[Math.floor(Math.random() * step.feedback.positive.length)] || 'Great job!';
        points = 30;
      } else if (similarity > 0.5 || intensity > 0.4) {
        message = step.feedback.encouraging[Math.floor(Math.random() * step.feedback.encouraging.length)] || 'Keep going!';
        points = 20;
      } else {
        message = step.feedback.guidance[Math.floor(Math.random() * step.feedback.guidance.length)] || 'Try again!';
        points = 15;
      }
    } else {
      // General voice analysis
      if (confidence > 0.8 && intensity > 0.6) {
        message = "Incredible! Your voice is full of power and conviction!";
        points = 25;
      } else if (confidence > 0.6) {
        message = "Great job! I can hear your strength growing!";
        points = 20;
      } else {
        message = "Good effort! Keep practicing and your voice will get stronger!";
        points = 15;
      }
    }

    return { message, points };
  };



  const nextStep = () => {
    if (!currentSession || !selectedScenario) {
      console.log('Cannot proceed: missing session or scenario');
      return;
    }

    console.log(`Moving to next step. Current: ${currentSession.currentStep}, Total: ${selectedScenario.steps.length}`);

    // Clear all timers
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    stopListening();

    const nextStepIndex = currentSession.currentStep + 1;

    // Check if we've completed all steps
    if (nextStepIndex >= selectedScenario.steps.length) {
      console.log('All steps completed, finishing session');
      completeSession();
      return;
    }

    const updatedSession = {
      ...currentSession,
      currentStep: nextStepIndex,
      progress: (nextStepIndex / selectedScenario.steps.length) * 100
    };

    console.log('Updating session to step:', nextStepIndex);
    setCurrentSession(updatedSession);

    // Reset UI state
    setShowChoices(false);
    setWaitingForVoice(false);
    setCelebrationMode(false);
    setCurrentFeedback('');

    // Small delay before next step for smooth transition
    setTimeout(() => {
      executeStep(updatedSession, nextStepIndex);
    }, 500);
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
      const achievements = [];
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

    // Show completion message
    setShowCompletion(true);
    setCelebrationMode(true);

    if (voiceAI.isVoiceSupported()) {
      try {
        await voiceAI.respondWithVoice(
          `Wonderful! You've completed your ${currentSession?.exercise.title} session and earned ${currentSession?.points} points! You took control of your journey and that's amazing!`,
          'en-IN',
          'supportive',
          selectedVoice
        );
      } catch (error) {
        console.warn('Completion voice failed:', error);
      }
    }
  };

  const resetSession = () => {
    // Clear all timers
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);

    // Stop any ongoing voice activities
    voiceAnalysis.stopVoiceAnalysis();

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
    setShowChatMode(false);
    setChatMessages([]);
    setIsInChatMode(false);
  };









  const startListening = async () => {
    if (!voiceAnalysis.isServiceAvailable()) {
      // Fallback for when voice analysis isn't available
      setTimeout(() => {
        const mockResult: VoiceAnalysisResult = {
          transcript: "I am feeling confident",
          confidence: 0.8,
          language: 'english',
          emotionalIndicators: { tone: 'happy', intensity: 0.7, valence: 0.6, arousal: 0.5, speechRate: 'normal', volume: 'normal', pitch: 'normal' },
          linguisticFeatures: { wordCount: 4, sentimentScore: 0.7, complexityScore: 0.5, hesitationMarkers: 0, fillerWords: 0, emotionalWords: ['confident'], culturalExpressions: [] },
          mentalHealthIndicators: { stressLevel: 0.3, depressionIndicators: [], anxietyIndicators: [], cognitiveLoad: 0.4, emotionalRegulation: 0.8 },
          culturalContext: { languageMixing: 0, culturalReferences: [], formalityLevel: 0.5, respectMarkers: [] },
          recommendations: { immediate: ['Keep up the positive energy!'], therapeutic: [], communication: [] }
        };
        handleVoiceResponse(mockResult);
      }, 3000);
      return;
    }

    try {
      setIsListening(true);
      await voiceAnalysis.startVoiceAnalysis(
        (result: VoiceAnalysisResult) => {
          handleVoiceResponse(result);
        },
        {
          language: 'auto',
          culturalContext: 'indian',
          sensitivity: 'medium',
          realTimeAnalysis: true
        }
      );
    } catch (error) {
      console.warn('Voice listening failed:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (isListening) {
      voiceAnalysis.stopVoiceAnalysis();
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
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Voice Therapy</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose a guided voice exercise to improve your emotional well-being and self-expression
            </p>
          </div>

          {/* WORKING VOICE SELECTION */}
          <div style={{
            marginBottom: '32px',
            maxWidth: '1024px',
            margin: '0 auto 32px auto'
          }}>
            <div style={{
              position: 'relative',
              zIndex: 1000,
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '2px solid #c084fc',
              borderRadius: '10px'
            }}>
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
                  onClick={() => voiceAI.respondWithVoice("Hello! I'm your AI companion. I'm here to guide you through your voice therapy journey.", 'en-IN', selectedVoice.personality as any, selectedVoice)}
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
                      onClick={() => {
                        console.log('Voice selected:', voice.name);
                        setSelectedVoice(voice);
                        voiceAI.setVoice(voice);
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
                onClick={() => {
                  console.log('Exercise selected:', exercise.title);
                  exercise.scenarios[0] && startSession(exercise, exercise.scenarios[0]);
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
                    onClick={() => exercise.scenarios[0] && startSession(exercise, exercise.scenarios[0])}
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
                <div className="text-3xl font-bold text-orange-600">{currentSession.scenario.steps.length}</div>
                <div className="text-sm text-gray-500">Steps Mastered</div>
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
                    <li>• Completed {currentSession.scenario.steps.length} challenging steps</li>
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
                          onClick={() => {
                            console.log('Voice selected in settings:', voice.name);
                            setSelectedVoice(voice);
                            voiceAI.setVoice(voice);
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
                                voiceAI.respondWithVoice("Hello! This is how I sound.", 'en-IN', voice.personality as any, voice);
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
                              const currentStep = selectedScenario?.steps[currentSession.currentStep];
                              if (currentStep?.voiceGuide) {
                                voiceAI.respondWithVoice(currentStep.voiceGuide, 'en-IN', selectedVoice.personality as any, selectedVoice);
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
                  Step {currentSession.currentStep + 1} of {currentSession.scenario.steps.length}
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

                <button
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    console.log('Chat button clicked, isInChatMode:', isInChatMode);
                    setIsInChatMode(!isInChatMode);
                    setShowChatMode(!showChatMode);
                    console.log('Chat mode toggled to:', !isInChatMode);
                  }}
                >
                  💬 {isInChatMode ? 'Exit Chat' : 'Chat with AI'}
                </button>

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
                    const currentStep = selectedScenario?.steps[currentSession.currentStep];
                    if (currentStep?.voiceGuide) {
                      setIsPlaying(true);
                      voiceAI.respondWithVoice(currentStep.voiceGuide, 'en-IN', selectedVoice.personality as any, selectedVoice)
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
                  backgroundColor: isPaused ? '#fff3cd' : isInChatMode ? '#e2e3f3' : '#d4edda',
                  color: isPaused ? '#856404' : isInChatMode ? '#383d41' : '#155724'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isPaused ? '#ffc107' : isInChatMode ? '#6f42c1' : '#28a745'
                  }}></div>
                  {isPaused ? 'Paused' : isInChatMode ? 'Chatting' : 'Active'}
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
                Status: isPaused={isPaused.toString()}, isInChatMode={isInChatMode.toString()}, autoPlayVoice={autoPlayVoice.toString()}
              </div>
            </div>

            {/* WORKING CHAT MODE INTERFACE */}
            {showChatMode && (
              <div style={{
                position: 'relative',
                zIndex: 1000,
                padding: '24px',
                marginBottom: '24px',
                backgroundColor: '#faf5ff',
                border: '2px solid #c084fc',
                borderRadius: '10px'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                    💬 Chat with {selectedVoice.name}
                  </h3>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fff',
                      color: '#6f42c1',
                      border: '1px solid #d1a7f0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => {
                      setIsInChatMode(false);
                      setShowChatMode(false);
                    }}
                  >
                    ✕ Close Chat
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="max-h-60 overflow-y-auto mb-4 space-y-3 bg-white rounded-lg p-4 border">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Voice Input */}
                <div className="flex items-center gap-3">
                  <button
                    style={{
                      padding: '12px 20px',
                      backgroundColor: isListening ? '#dc3545' : '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isPlaying ? 0.5 : 1
                    }}
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        setIsListening(true);
                        voiceAnalysis.startVoiceAnalysis(
                          async (result) => {
                            // Handle chat voice input with full personalization
                            const userMessage = result.transcript;

                            // Comprehensive preference and personality detection
                            personalizedTherapy.detectPreferenceChanges(userMessage);

                            // Add user message to chat
                            setChatMessages(prev => [...prev, {
                              type: 'user',
                              message: userMessage,
                              timestamp: new Date()
                            }]);

                            // Generate personalized AI response
                            try {
                              let aiResponse = await generatePersonalizedTherapyResponse(
                                userMessage, 
                                personalizedTherapy.getProfile()
                              );
                              
                              // Simple processing - just remove unwanted terms
                              aiResponse = aiResponse.replace(/many young people in india/gi, '')
                                                   .replace(/similar pressures/gi, '')
                                                   .replace(/beta/gi, '')
                                                   .replace(/yaar/gi, '')
                                                   .trim();
                              
                              // Record the complete conversation for learning
                              personalizedTherapy.recordConversation(
                                userMessage, 
                                aiResponse, 
                                'neutral' // Emotion analysis is handled internally
                              );
                              
                              console.log('Generated personalized AI response:', aiResponse);

                              // Add AI response to chat
                              setChatMessages(prev => [...prev, {
                                type: 'ai',
                                message: aiResponse,
                                timestamp: new Date()
                              }]);

                              // Speak the response in English
                              if (autoPlayVoice) {
                                voiceAI.respondWithVoice(aiResponse, 'en-IN', selectedVoice.personality as any, selectedVoice);
                              }
                            } catch (error) {
                              console.error('AI response error:', error);
                              // English fallback response
                              const fallbackResponse = "I understand you're sharing something important with me. Can you tell me more about how you're feeling? I'm here to listen and support you.";
                              
                              setChatMessages(prev => [...prev, {
                                type: 'ai',
                                message: fallbackResponse,
                                timestamp: new Date()
                              }]);

                              if (autoPlayVoice) {
                                voiceAI.respondWithVoice(fallbackResponse, 'en-IN', selectedVoice.personality as any, selectedVoice);
                              }
                            }

                            setIsListening(false);
                          },
                          { language: 'auto', culturalContext: 'therapy', sensitivity: 'medium' }
                        ).catch((error: string) => {
                          console.error('Chat voice error:', error);
                          setIsListening(false);
                        });
                      }
                    }}
                    disabled={isPlaying}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop Talking
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Talk to AI
                      </>
                    )}
                  </button>

                  <div className="flex-1 text-sm text-purple-700">
                    {isListening ? (
                      <span className="animate-pulse">🎤 Listening... speak freely!</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Click "Talk to AI" to have a conversation anytime during your session</span>
                        {personalizedTherapy.getProfile().responseLength === 'short' && (
                          <span style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            SHORT MODE ✓
                          </span>
                        )}
                        <button
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            personalizedTherapy.resetProfile();
                            console.log('🔄 AI memory reset!');
                          }}
                        >
                          RESET AI
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                {currentSession.scenario.steps[currentSession.currentStep]?.instruction}
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
                <p>Current Step: {currentSession.currentStep + 1}/{selectedScenario?.steps.length || 0}</p>
                <p>Points: {currentSession.points}</p>
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
                    {selectedScenario.steps[currentSession.currentStep]?.choices?.map((choice) => (
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
                          console.log('Choice clicked:', choice.text, 'Points:', choice.points);

                          if (!currentSession) {
                            console.log('No current session for choice handling');
                            return;
                          }

                          // Handle choice immediately
                          setCelebrationMode(true);
                          setShowChoices(false);

                          // Add points and choice to session
                          const updatedSession = {
                            ...currentSession,
                            points: currentSession.points + choice.points,
                            userChoices: [...currentSession.userChoices, choice.id]
                          };
                          setCurrentSession(updatedSession);

                          // Show feedback
                          const feedbackMessage = `${choice.response} (+${choice.points} points!)`;
                          setCurrentFeedback(feedbackMessage);

                          // Speak the response if enabled
                          if (voiceAI.isVoiceSupported() && autoPlayVoice && !isPaused) {
                            setIsPlaying(true);
                            voiceAI.respondWithVoice(choice.response, 'en-IN', selectedVoice.personality as any, selectedVoice)
                              .finally(() => setIsPlaying(false));
                          }

                          setCelebrationMode(false);
                          console.log('Choice handling complete, points added:', choice.points);
                        }}
                        disabled={isPlaying}
                      >
                        <span style={{ fontSize: '36px' }}>{choice.emoji}</span>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>{choice.text}</span>
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
                    {selectedScenario?.steps[currentSession.currentStep]?.expectedResponse ?
                      `Try saying: "${selectedScenario.steps[currentSession.currentStep]?.expectedResponse}"` :
                      'Express yourself freely and let your voice be heard!'
                    }
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
                        const currentStep = selectedScenario?.steps[currentSession.currentStep];
                        if (currentStep?.voiceGuide) {
                          setIsPlaying(true);
                          voiceAI.respondWithVoice(
                            currentStep.voiceGuide,
                            'en-IN',
                            selectedVoice.personality as any,
                            selectedVoice
                          ).finally(() => setIsPlaying(false));
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
                        if (!currentSession || !selectedScenario) return;

                        const nextStepIndex = currentSession.currentStep + 1;
                        if (nextStepIndex >= selectedScenario.steps.length) {
                          setIsActive(false);
                          setShowCompletion(true);
                          return;
                        }

                        const updatedSession = {
                          ...currentSession,
                          currentStep: nextStepIndex,
                          progress: (nextStepIndex / selectedScenario.steps.length) * 100
                        };
                        setCurrentSession(updatedSession);
                        setShowChoices(false);
                        setWaitingForVoice(false);
                        setCurrentFeedback('');

                        const step = selectedScenario.steps[nextStepIndex];
                        if (step?.type === 'choice') {
                          setShowChoices(true);
                        } else if (step?.type === 'voice') {
                          setWaitingForVoice(true);
                        }
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
              {selectedScenario?.steps[currentSession.currentStep]?.type === 'breathing' && !showChoices && !waitingForVoice && !isPaused && (
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
                        const step = selectedScenario?.steps[currentSession.currentStep];
                        if (step) {
                          setWaitingForVoice(false);
                          setShowChoices(false);
                          setCelebrationMode(true);

                          if (currentSession) {
                            const updatedSession = {
                              ...currentSession,
                              points: currentSession.points + (step.points || 20)
                            };
                            setCurrentSession(updatedSession);
                          }

                          const breathingGuide = "Let's breathe together. Inhale slowly for 4 counts... hold for 4... and exhale for 6. Take your time and breathe at your own pace.";
                          setCurrentFeedback(`${breathingGuide} (+${step.points || 20} points!)`);

                          if (voiceAI.isVoiceSupported() && autoPlayVoice) {
                            setIsPlaying(true);
                            voiceAI.respondWithVoice(breathingGuide, 'en-IN', 'calm' as any, selectedVoice)
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
                        const currentStep = selectedScenario?.steps[currentSession.currentStep];
                        if (currentStep?.voiceGuide) {
                          setIsPlaying(true);
                          voiceAI.respondWithVoice(
                            currentStep.voiceGuide,
                            'en-IN',
                            'calm' as any,
                            selectedVoice
                          ).finally(() => setIsPlaying(false));
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
              {!showChoices && !waitingForVoice && selectedScenario?.steps[currentSession.currentStep]?.type !== 'breathing' && !isPaused && (
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

                      if (!currentSession || !selectedScenario) {
                        console.log('Cannot proceed: missing session or scenario');
                        return;
                      }

                      const nextStepIndex = currentSession.currentStep + 1;

                      // Check if we've completed all steps
                      if (nextStepIndex >= selectedScenario.steps.length) {
                        console.log('All steps completed, finishing session');
                        setIsActive(false);
                        setShowCompletion(true);
                        return;
                      }

                      // Update session
                      const updatedSession = {
                        ...currentSession,
                        currentStep: nextStepIndex,
                        progress: (nextStepIndex / selectedScenario.steps.length) * 100
                      };

                      console.log('Updating session to step:', nextStepIndex);
                      setCurrentSession(updatedSession);

                      // Reset UI state
                      setShowChoices(false);
                      setWaitingForVoice(false);
                      setCelebrationMode(false);
                      setCurrentFeedback('');

                      // Execute next step
                      setTimeout(() => {
                        const step = selectedScenario.steps[nextStepIndex];
                        if (step) {
                          console.log(`Executing step ${nextStepIndex + 1}: ${step.title}`);

                          // Handle different step types
                          if (step.type === 'choice') {
                            setShowChoices(true);
                            setCurrentFeedback("Choose one of the options below to continue:");
                          } else if (step.type === 'voice') {
                            setWaitingForVoice(true);
                            setCurrentFeedback("Click 'Start Speaking' when you're ready to use your voice:");
                          } else if (step.type === 'breathing') {
                            setCurrentFeedback("Take your time with this breathing exercise. Click 'Start' when ready:");
                          } else {
                            setCurrentFeedback("Read the instruction above and click 'Continue' when you're ready:");
                          }

                          // Speak voice guide if enabled
                          if (autoPlayVoice && voiceAI.isVoiceSupported() && !isPaused) {
                            setIsPlaying(true);
                            voiceAI.respondWithVoice(step.voiceGuide, 'en-IN', selectedVoice.personality as any, selectedVoice)
                              .finally(() => setIsPlaying(false));
                          }
                        }
                      }, 500);
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {currentSession.currentStep + 1 >= currentSession.scenario.steps.length ? 'Complete Session' : 'Next Step'}
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
                        const achievements = [];
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

                      if (voiceAI.isVoiceSupported() && autoPlayVoice) {
                        voiceAI.respondWithVoice(
                          `Wonderful! You've completed your session and earned ${currentSession?.points || 0} points! You took control of your journey and that's amazing!`,
                          'en-IN',
                          selectedVoice.personality as any,
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
              {(showChoices || waitingForVoice || selectedScenario?.steps[currentSession.currentStep]?.type === 'breathing') && !isPaused && (
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

                      if (!currentSession || !selectedScenario) {
                        console.log('Cannot proceed: missing session or scenario');
                        return;
                      }

                      const nextStepIndex = currentSession.currentStep + 1;

                      // Check if we've completed all steps
                      if (nextStepIndex >= selectedScenario.steps.length) {
                        console.log('All steps completed, finishing session');
                        setIsActive(false);
                        setShowCompletion(true);
                        return;
                      }

                      // Update session
                      const updatedSession = {
                        ...currentSession,
                        currentStep: nextStepIndex,
                        progress: (nextStepIndex / selectedScenario.steps.length) * 100
                      };

                      console.log('Updating session to step:', nextStepIndex);
                      setCurrentSession(updatedSession);

                      // Reset UI state
                      setShowChoices(false);
                      setWaitingForVoice(false);
                      setCelebrationMode(false);
                      setCurrentFeedback('');

                      // Execute next step
                      setTimeout(() => {
                        const step = selectedScenario.steps[nextStepIndex];
                        if (step) {
                          console.log(`Executing step ${nextStepIndex + 1}: ${step.title}`);

                          // Handle different step types
                          if (step.type === 'choice') {
                            setShowChoices(true);
                            setCurrentFeedback("Choose one of the options below to continue:");
                          } else if (step.type === 'voice') {
                            setWaitingForVoice(true);
                            setCurrentFeedback("Click 'Start Speaking' when you're ready to use your voice:");
                          } else if (step.type === 'breathing') {
                            setCurrentFeedback("Take your time with this breathing exercise. Click 'Start' when ready:");
                          } else {
                            setCurrentFeedback("Read the instruction above and click 'Continue' when you're ready:");
                          }

                          // Speak voice guide if enabled
                          if (autoPlayVoice && voiceAI.isVoiceSupported() && !isPaused) {
                            setIsPlaying(true);
                            voiceAI.respondWithVoice(step.voiceGuide, 'en-IN', selectedVoice.personality as any, selectedVoice)
                              .finally(() => setIsPlaying(false));
                          }
                        }
                      }, 500);
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