import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ArrowLeft, Send, User, Heart, AlertTriangle, Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { Screen, UserData } from '../types';
import { type ConversationContext, type AIResponse } from '../services/googleCloudAI';
import { aiOrchestrator } from '../services/aiOrchestrator';
import { assessCrisisLevel, shouldShowCrisisResources } from '../utils/crisisDetection';
import { useAuth } from './auth/AuthProvider';
import { useFirebaseSession } from '../hooks/useFirebaseSession';
import { voiceAI } from '../services/speechServices';
import { emotionDetection } from '../services/emotionDetection';

// Function to strip markdown for voice reading
const stripMarkdownForVoice = (text: string): string => {
  return text
    // Remove bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markers
    .replace(/\*(.*?)\*/g, '$1')
    // Remove code markers
    .replace(/`(.*?)`/g, '$1')
    // Convert bullet points to "bullet point"
    .replace(/^[-•]\s*/gm, '• ')
    // Convert numbered lists to "step"
    .replace(/^(\d+)\.\s*/gm, 'Step $1: ')
    // Remove markdown links, keep only text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// Simple markdown renderer component
const MarkdownRenderer = ({ content }: { content: string }) => {
  const formatText = (text: string) => {
    // Split by line breaks and process each line
    return text.split('\n').map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={index} className="flex items-start space-x-3 my-3">
            <span className="text-primary mt-1 font-bold text-xl">•</span>
            <span className="flex-1 text-lg font-semibold leading-relaxed text-foreground">{formatInlineText(line.replace(/^[-•]\s*/, ''))}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (line.trim().match(/^\d+\.\s/)) {
        return (
          <div key={index} className="flex items-start space-x-3 my-3">
            <span className="text-primary font-bold mt-1 text-lg">{line.match(/^\d+\./)?.[0]}</span>
            <span className="flex-1 text-lg font-semibold leading-relaxed text-foreground">{formatInlineText(line.replace(/^\d+\.\s*/, ''))}</span>
          </div>
        );
      }

      // Handle regular paragraphs
      if (line.trim()) {
        return (
          <p key={index} className="my-3 text-lg leading-relaxed font-semibold text-foreground">
            {formatInlineText(line)}
          </p>
        );
      }

      // Empty lines
      return <br key={index} />;
    });
  };

  const formatInlineText = (text: string) => {
    // Handle bold text **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground text-lg">$1</strong>');

    // Handle italic text *text*
    text = text.replace(/\*(.*?)\*/g, '<em class="italic text-foreground font-semibold text-lg">$1</em>');

    // Handle code `text`
    text = text.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Handle links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return <div className="prose prose-lg max-w-none text-lg leading-relaxed font-semibold">{formatText(content)}</div>;
};


interface VoiceAnalysis {
  transcript: string;
  confidence: number;
  language: string;
  emotionalIndicators: {
    tone: string;
    intensity: number;
    speechRate: string;
    volume: string;
  };
  linguisticFeatures: {
    wordCount: number;
    sentimentScore: number;
    complexityScore: number;
    hesitationMarkers: number;
  };
}

interface EmotionAnalysis {
  faceDetected: boolean;
  emotions: {
    joy: number;
    sorrow: number;
    anger: number;
    surprise: number;
    fear: number;
    disgust: number;
  };
  primary_emotion: string;
  confidence: number;
  wellness_indicators: {
    stress_level: number;
    energy_level: number;
    engagement_level: number;
  };
  facialFeatures: {
    eyeContact: boolean;
    facialTension: number;
    microExpressions: string[];
  };
}

interface AICompanionProps {
  navigateTo?: (screen: Screen) => void;
  userData?: UserData;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  mood?: 'positive' | 'neutral' | 'negative' | 'crisis';
  aiResponse?: AIResponse;
  voiceAnalysis?: VoiceAnalysis | undefined;
  emotionAnalysis?: EmotionAnalysis | undefined;
}

export function AICompanion({ navigateTo, userData }: AICompanionProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);

  const { currentUser, userProfile } = useAuth();
  const {
    isSessionActive,
    startSession,
    addInteraction,
    addEmotionalDataPoint,
    recordCrisisEvent
  } = useFirebaseSession();

  // Stop voice response function
  const stopVoiceResponse = () => {
    try {
      if (voiceAI.isVoiceSupported()) {
        voiceAI.stopVoice();
        setIsVoicePlaying(false);
      }
    } catch (error) {
      console.error('Error stopping voice:', error);
    }
  };

  // Debug: Log userData and API key status
  console.log('🔍 AICompanion Debug:', {
    userData: userProfile || userData,
    hasUserData: !!(userProfile || userData),
    currentUser: currentUser?.uid,
    apiKey: import.meta.env.VITE_GEMINI_API_KEY ? 'Present' : 'Missing',
    apiKeyLength: import.meta.env.VITE_GEMINI_API_KEY?.length || 0
  });

  // Crisis helplines for India
  const crisisHelplines = [
    { name: 'Vandrevala Foundation', number: '9999 666 555', available: '24/7' },
    { name: 'AASRA', number: '91-22-27546669', available: '24/7' },
    { name: 'Sneha Foundation', number: '044-24640050', available: '24/7' },
    { name: 'iCall', number: '9152987821', available: 'Mon-Sat, 8AM-10PM' }
  ];

  // Removed buildMentalHealthContext - now using simpler context directly in functions

  // Handle voice input with continuous speech recognition
  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }

    if (isVoiceMode) {
      setIsVoiceMode(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      const language = userData?.preferences?.preferredLanguage === 'hindi' ? 'hi-IN' : 'en-IN';

      // Configure for continuous speech with interim results
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';


      recognition.onstart = () => {
        setIsVoiceMode(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';

            // Voice analysis data is handled by the AI orchestrator

            // Update input field with accumulated text
            setInputValue(finalTranscript.trim());

          } else {
            interimTranscript += transcript;
            // Show interim results in input field
            setInputValue((finalTranscript + interimTranscript).trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsVoiceMode(false);

        if (event.error === 'no-speech') {
          // Don't show error for no-speech, just stop
          return;
        }

        alert(`Voice recognition error: ${event.error}. Please try again.`);
      };

      recognition.onend = () => {
        setIsVoiceMode(false);
        console.log('Voice recognition ended');

        // If we have accumulated text, keep it in the input field
        if (finalTranscript.trim()) {
          setInputValue(finalTranscript.trim());
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Voice input error:', error);
      setIsVoiceMode(false);
      alert('Voice input failed. Please try typing instead.');
    }
  };

  // Handle video mood detection with real-time analysis
  const handleVideoMood = async () => {
    if (!emotionDetection.isServiceAvailable()) {
      alert('Camera not supported in this browser');
      return;
    }

    if (isVideoMode) {
      emotionDetection.stopRealTimeAnalysis();
      setIsVideoMode(false);
      setCurrentEmotion(null);
      return;
    }

    try {
      // Request camera permission first
      const hasPermission = await emotionDetection.requestCameraPermission();
      if (!hasPermission) {
        alert('Camera access denied. Please enable camera permissions and try again.');
        return;
      }

      setIsVideoMode(true);
      console.log('Starting real-time emotion detection...');

      // Start real-time emotion analysis
      await emotionDetection.startRealTimeAnalysis(
        (result) => {
          console.log('Emotion detection result:', result);

          // Convert to our format
          const emotionAnalysis: EmotionAnalysis = {
            faceDetected: result.faceDetected,
            emotions: result.emotions,
            primary_emotion: result.primaryEmotion,
            confidence: result.confidence,
            wellness_indicators: {
              stress_level: result.wellnessIndicators.stressLevel,
              energy_level: 1 - result.wellnessIndicators.fatigueLevel,
              engagement_level: result.wellnessIndicators.engagementLevel
            },
            facialFeatures: {
              eyeContact: result.facialFeatures.eyeContact,
              facialTension: result.facialFeatures.facialTension,
              microExpressions: result.facialFeatures.microExpressions
            }
          };

          setCurrentEmotion(emotionAnalysis);

          // Provide immediate feedback based on detected emotion
          if (result.recommendations.immediate.length > 0) {
            console.log('Emotion-based recommendation:', result.recommendations.immediate[0]);
          }
        },
        {
          interval: 2000, // Analyze every 2 seconds
          culturalContext: 'indian',
          sensitivity: 'medium'
        }
      );

      // Auto-stop after 15 seconds to avoid overwhelming the user
      setTimeout(() => {
        if (isVideoMode) {
          emotionDetection.stopRealTimeAnalysis();
          setIsVideoMode(false);
          console.log('Emotion detection session completed');
        }
      }, 15000);

    } catch (error) {
      console.error('Emotion detection error:', error);
      setIsVideoMode(false);

      if (error instanceof Error) {
        if (error.message.includes('camera')) {
          alert('Camera access failed. Please check your camera permissions and try again.');
        } else {
          alert('Failed to start emotion detection. Please try again.');
        }
      }
    }
  };



  // Initialize with personalized greeting and Firebase session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Start Firebase session if not already active
        if (currentUser && !isSessionActive) {
          await startSession('chat');
        }

        // Generate personalized greeting using Gemini AI
        // Validate and cast language preference with fallback
        const activeUserData = userProfile || userData;
        const userLanguage = (activeUserData?.preferences as any)?.language || (activeUserData?.preferences as any)?.preferredLanguage || 'mixed';
        const validLanguage: 'english' | 'hindi' | 'mixed' =
          userLanguage === 'english' || userLanguage === 'hindi' || userLanguage === 'mixed'
            ? userLanguage
            : 'mixed';

        const context: ConversationContext = {
          userMood: 'neutral',
          preferredLanguage: validLanguage,
          culturalBackground: 'Indian youth',
          previousMessages: [],
          userPreferences: {
            interests: activeUserData?.preferences?.interests || [],
            comfortEnvironment: activeUserData?.preferences?.comfortEnvironment || 'peaceful',
            avatarStyle: activeUserData?.preferences?.avatarStyle || 'supportive'
          },
          crisisLevel: 'none'
        };

        console.log('🚀 Initializing AI companion with context:', context);
        const therapeuticGreeting = await aiOrchestrator.generateTherapeuticResponse(
          "User just opened the app for the first time today. Greet them warmly and ask how they're feeling today without making any assumptions about their emotional state.",
          currentUser?.uid || 'anonymous',
          {
            session: { sessionId: 'greeting-session' },
            emotionalAnalysis: null,
            riskAssessment: { level: 'none' },
            adaptations: []
          }
        );

        const greetingResponse: AIResponse = {
          message: therapeuticGreeting.message,
          originalLanguage: validLanguage,
          emotionalTone: 'supportive',
          suggestedActions: therapeuticGreeting.resources.selfHelp.map(action => ({
            action: action,
            priority: 'medium' as const,
            category: 'immediate' as const
          })),
          copingStrategies: therapeuticGreeting.emotionalSupport.copingStrategies,
          followUpQuestions: therapeuticGreeting.followUp.focus,
          riskAssessment: {
            level: therapeuticGreeting.riskAssessment.level,
            indicators: therapeuticGreeting.riskAssessment.indicators,
            recommendedIntervention: therapeuticGreeting.riskAssessment.immediateActions.join(', ') || 'Continue conversation'
          },
          culturalReferences: therapeuticGreeting.culturalAdaptation.culturalReferences,
          confidence: 0.9
        };

        const greeting: Message = {
          id: '1',
          content: greetingResponse.message,
          sender: 'ai',
          timestamp: new Date(),
          aiResponse: greetingResponse
        };

        setMessages([greeting]);
      } catch (error) {
        console.error('Chat initialization error:', error);

        // Fallback greeting
        const activeUserData = userProfile || userData;
        const userLanguage = (activeUserData?.preferences as any)?.language || (activeUserData?.preferences as any)?.preferredLanguage || 'mixed';
        const language: 'english' | 'hindi' | 'mixed' =
          userLanguage === 'english' || userLanguage === 'hindi' || userLanguage === 'mixed'
            ? userLanguage
            : 'mixed';

        const fallbackGreetings = {
          english: "Hi there! I'm MannMitra, your AI companion. I'm here to listen and support you. How are you feeling today?",
          hindi: "नमस्ते! मैं मन मित्र हूँ, आपका AI साथी। मैं यहाँ आपको सुनने और सहारा देने के लिए हूँ। आज आप कैसा महसूस कर रहे हैं?",
          mixed: "Hi! मैं MannMitra हूँ, आपका AI companion। I'm here आपको support करने के लिए। आज कैसा feel कर रहे हैं?"
        };

        const greeting: Message = {
          id: '1',
          content: fallbackGreetings[language],
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages([greeting]);
      }
    };

    initializeChat();
  }, [currentUser, userProfile, isSessionActive, startSession]);

  const handleSendMessage = async (voiceAnalysis?: VoiceAnalysis) => {
    const messageText = inputValue.trim();
    if (!messageText) return;

    // 🚨 Crisis detection
    const crisisAssessment = assessCrisisLevel(messageText);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
      mood:
        crisisAssessment.level === 'none'
          ? 'neutral'
          : crisisAssessment.level === 'severe' || crisisAssessment.level === 'high'
            ? 'crisis'
            : 'negative',
      voiceAnalysis: voiceAnalysis || undefined,
      emotionAnalysis: currentEmotion || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInputValue('');
    setIsTyping(true);

    // 🚨 Show crisis support UI if needed
    if (shouldShowCrisisResources(crisisAssessment)) {
      setShowCrisisSupport(true);
    }

    // 📊 Update Firebase session with user interaction
    if (isSessionActive) {
      try {
        await addInteraction({
          type: 'user_message',
          content: messageText,
          metadata: {
            crisisLevel: crisisAssessment.level,
            voiceAnalysis,
            emotionAnalysis: currentEmotion
          }
        });

        // Add emotional data point if available
        if (currentEmotion) {
          await addEmotionalDataPoint({
            primaryEmotion: currentEmotion.primary_emotion,
            intensity: currentEmotion.confidence,
            valence: 0, // Would be calculated from emotion
            arousal: currentEmotion.wellness_indicators.stress_level,
            confidence: currentEmotion.confidence,
            source: voiceAnalysis ? 'voice' : 'text'
          });
        }

        // Record crisis event if detected
        if (crisisAssessment.level !== 'none' && crisisAssessment.level !== 'low') {
          await recordCrisisEvent({
            severity: crisisAssessment.level as 'moderate' | 'high' | 'severe',
            triggerMessage: messageText,
            detectedIndicators: crisisAssessment.triggeredKeywords
          });
        }
      } catch (error) {
        console.error('Error updating Firebase session:', error);
      }
    }

    try {
      // Context is now handled by AI Orchestrator

      // ✅ Call AI Orchestrator for therapeutic response
      const therapeuticResponse = await aiOrchestrator.generateTherapeuticResponse(
        messageText,
        currentUser?.uid || 'anonymous',
        {
          session: { sessionId: 'chat-session' },
          emotionalAnalysis: currentEmotion,
          riskAssessment: crisisAssessment,
          adaptations: []
        }
      );

      // Convert therapeutic response to AI response format for compatibility
      const activeUserData = userProfile || userData;
      const userLanguage = (activeUserData?.preferences as any)?.language || (activeUserData?.preferences as any)?.preferredLanguage || 'mixed';
      const responseLanguage: string = userLanguage === 'english' || userLanguage === 'hindi' || userLanguage === 'mixed' ? userLanguage : 'mixed';

      const aiResponse: AIResponse = {
        message: therapeuticResponse.message,
        originalLanguage: responseLanguage,
        emotionalTone: 'supportive',
        suggestedActions: therapeuticResponse.resources.selfHelp.map(action => ({
          action: action,
          priority: 'medium' as const,
          category: 'immediate' as const
        })),
        copingStrategies: therapeuticResponse.emotionalSupport.copingStrategies,
        followUpQuestions: therapeuticResponse.followUp.focus,
        riskAssessment: {
          level: therapeuticResponse.riskAssessment.level,
          indicators: therapeuticResponse.riskAssessment.indicators,
          recommendedIntervention: therapeuticResponse.riskAssessment.immediateActions.join(', ') || 'Continue conversation'
        },
        culturalReferences: therapeuticResponse.culturalAdaptation.culturalReferences,
        confidence: 0.9
      };

      const botMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse.message,
        sender: 'ai',
        timestamp: new Date(),
        mood: 'neutral',
        aiResponse
      };

      setMessages((prev) => [...prev, botMessage]);

      // Add voice response if enabled and supported
      if (voiceResponseEnabled && userData?.preferences?.preferredLanguage && voiceAI.isVoiceSupported()) {
        try {
          const language = userData.preferences.preferredLanguage === 'hindi' ? 'hi-IN' : 'en-IN';
          const moodText = aiResponse.riskAssessment.level?.toLowerCase() || '';
          const emotionalTone = moodText.includes('positive') || moodText.includes('happy') ? 'supportive' :
            moodText.includes('negative') || moodText.includes('sad') || moodText.includes('anxious') ? 'calm' : 'calm';

          // Clean the message for voice reading
          const cleanMessage = stripMarkdownForVoice(aiResponse.message);

          // Set voice playing state
          setIsVoicePlaying(true);

          // Speak the AI response
          await voiceAI.respondWithVoice(cleanMessage, language, emotionalTone);

          // Reset voice playing state when done
          setIsVoicePlaying(false);
        } catch (error) {
          console.error('Voice response error:', error);
          setIsVoicePlaying(false);
        }
      }

      // 📊 Update Firebase session with AI response
      if (isSessionActive) {
        try {
          await addInteraction({
            type: 'ai_response',
            content: aiResponse.message,
            metadata: {
              interventionType: 'empathic_response',
              moodAssessment: aiResponse.riskAssessment.level,
              suggestedActions: aiResponse.suggestedActions
            }
          });
        } catch (error) {
          console.error('Error updating session with AI response:', error);
        }
      }
    } catch (error) {
      console.error('❌ AI error:', error);

      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content:
          'Sorry, I had trouble connecting to my AI service. But I’m still here to listen to you.',
        sender: 'ai',
        timestamp: new Date(),
        mood: 'neutral',
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const quickResponses = [
    'मैं stressed feel कर रहा हूँ',
    'I feel anxious',
    'Start Assessment',
    'How are you today?',
    'Need someone to talk',
    'Feeling stressed',
    'Want to share something'
  ];

  return (
    <div className="relative min-h-screen p-6 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo?.('home')}
            className="mr-4 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">आपका मित्र / Your Companion</h1>
              <p className="text-xs text-muted-foreground">हमेशा यहाँ सुनने के लिए / Always here to listen</p>
              {/* API Status Indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY.startsWith('demo-')
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
                  }`}></div>
                <span className="text-xs text-gray-500">
                  {import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY.startsWith('demo-')
                    ? 'AI Powered'
                    : 'Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Support Banner */}
        {showCrisisSupport && (
          <Card className="p-4 mb-4 bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-2">तत्काल सहायता / Immediate Support</h3>
                <p className="text-sm text-red-700 mb-3">
                  आप अकेले नहीं हैं। Professional help available है:
                </p>
                <div className="space-y-2">
                  {crisisHelplines.slice(0, 2).map((helpline, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{helpline.name}:</span>
                      <span className="text-red-800">{helpline.number}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCrisisSupport(false)}
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  समझ गया / Got it
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* API Key Notice */}
        {(!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY.startsWith('demo-')) && (
          <Card className="p-3 mb-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 text-sm">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium">Demo Mode Active</p>
                <p className="text-xs text-yellow-700">
                  Add your Gemini API key to enable real AI responses.
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                    Get free API key
                  </a>
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      const testMessage = "Hello, I'm feeling a bit anxious today. Can you help me?";
                      setInputValue(testMessage);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded transition-colors"
                  >
                    Test Demo Response
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user'
                  ? 'bg-primary/20'
                  : 'bg-secondary/50'
                  }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Heart className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <Card className={`p-5 ${message.sender === 'user'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border-primary/20 shadow-md'
                    }`}>
                    {message.sender === 'ai' ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <p className="text-lg leading-relaxed font-semibold">{message.content}</p>
                    )}
                  </Card>
                  <p className={`text-xs text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-8 h-8 bg-secondary/50 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <Card className="p-3 bg-card border-primary/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Input with Voice and Video */}
        <div className="space-y-3">
          {/* Enhanced Emotion indicator */}
          {currentEmotion && (
            <Card className="p-4 mb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentEmotion.primary_emotion === 'joy' ? 'bg-yellow-100' :
                      currentEmotion.primary_emotion === 'sorrow' ? 'bg-blue-100' :
                        currentEmotion.primary_emotion === 'anger' ? 'bg-red-100' :
                          currentEmotion.primary_emotion === 'fear' ? 'bg-purple-100' :
                            currentEmotion.primary_emotion === 'surprise' ? 'bg-green-100' :
                              'bg-gray-100'
                      }`}>
                      <span className="text-sm">
                        {currentEmotion.primary_emotion === 'joy' ? '😊' :
                          currentEmotion.primary_emotion === 'sorrow' ? '😢' :
                            currentEmotion.primary_emotion === 'anger' ? '😠' :
                              currentEmotion.primary_emotion === 'fear' ? '😰' :
                                currentEmotion.primary_emotion === 'surprise' ? '😲' :
                                  '😐'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 capitalize">
                        {currentEmotion.primary_emotion}
                      </p>
                      <p className="text-xs text-blue-600">
                        {Math.round(currentEmotion.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${currentEmotion.confidence > 0.8 ? 'bg-green-400' :
                    currentEmotion.confidence > 0.6 ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                </div>

                {/* Wellness indicators */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700">
                      {Math.round(currentEmotion.wellness_indicators.stress_level * 100)}%
                    </div>
                    <div className="text-gray-500">Stress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700">
                      {Math.round(currentEmotion.wellness_indicators.energy_level * 100)}%
                    </div>
                    <div className="text-gray-500">Energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700">
                      {Math.round(currentEmotion.wellness_indicators.engagement_level * 100)}%
                    </div>
                    <div className="text-gray-500">Focus</div>
                  </div>
                </div>

                {/* Quick emotion-based suggestions */}
                {currentEmotion.wellness_indicators.stress_level > 0.6 && (
                  <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                    💡 High stress detected. Try taking 3 deep breaths.
                  </div>
                )}
                {currentEmotion.wellness_indicators.energy_level < 0.3 && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                    💡 Low energy detected. Consider a short break or some light movement.
                  </div>
                )}
                {currentEmotion.primary_emotion === 'sorrow' && (
                  <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                    💜 It's okay to feel sad. You're not alone in this.
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isVoiceMode ? "Listening... / सुन रहा हूँ..." : "अपनी बात कहें... / Share your thoughts..."}
              className="flex-1 border-primary/20 focus:border-primary/40"
              onKeyDown={(e) => e.key === 'Enter' && !isVoiceMode && handleSendMessage()}
              disabled={isVoiceMode}
            />

            {/* Voice input button */}
            <Button
              onClick={handleVoiceInput}
              variant={isVoiceMode ? "default" : "outline"}
              size="sm"
              className={isVoiceMode ? "bg-red-500 hover:bg-red-600 text-white" : "border-primary/30 hover:bg-primary/5"}
              title={isVoiceMode ? "Stop listening" : "Start voice input"}
            >
              {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            {/* Voice response toggle */}
            <Button
              onClick={() => setVoiceResponseEnabled(!voiceResponseEnabled)}
              variant={voiceResponseEnabled ? "default" : "outline"}
              size="sm"
              className={voiceResponseEnabled ? "bg-blue-500 hover:bg-blue-600 text-white" : "border-primary/30 hover:bg-primary/5"}
              title={voiceResponseEnabled ? "Disable voice responses" : "Enable voice responses"}
            >
              <Heart className={`w-4 h-4 ${voiceResponseEnabled ? 'text-white' : 'text-blue-500'}`} />
            </Button>

            {/* Video mood detection button */}
            <Button
              onClick={handleVideoMood}
              variant={isVideoMode ? "default" : "outline"}
              size="sm"
              className={isVideoMode ? "bg-green-500 hover:bg-green-600 text-white" : "border-primary/30 hover:bg-primary/5"}
              title={isVideoMode ? "Stop mood detection" : "Start mood detection"}
            >
              {isVideoMode ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>

            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping || isVoiceMode}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Voice control button */}
          {isVoicePlaying && (
            <div className="flex justify-center mb-3">
              <Button
                onClick={stopVoiceResponse}
                variant="outline"
                size="sm"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Voice
              </Button>
            </div>
          )}

          {/* Quick responses */}
          <div className="flex flex-wrap gap-2">
            {quickResponses.map((response, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(response);
                  setTimeout(handleSendMessage, 100);
                }}
                className="text-xs border-primary/30 hover:bg-primary/5"
              >
                {response}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICompanion;