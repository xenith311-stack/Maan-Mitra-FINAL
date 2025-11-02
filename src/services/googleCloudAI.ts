// Browser-Compatible Google AI Integration for MannMitra
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Simple ConversationContext interface for compatibility
export interface ConversationContext {
  userMood: string;
  preferredLanguage: string; // Allow general string for flexibility, e.g., 'en-IN', 'hi-IN', 'bn-IN', 'mixed'
  culturalBackground: string;
  previousMessages: string[];
  userPreferences: {
    interests: string[];
    comfortEnvironment: string;
    avatarStyle: string;
  };
  crisisLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
}

// Configuration
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY as string || 'demo-key';

let genAI: GoogleGenerativeAI | null = null; // Initialize client only once

// Check if API key is properly configured
if (GEMINI_API_KEY === 'demo-key') {
  console.warn('⚠️ GEMINI_API_KEY not configured. Using demo mode with fallback responses.');
}

// Initialize Google AI
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface MentalHealthContext {
  userId: string;
  sessionId: string;
  userProfile: {
    age?: number;
    gender?: string;
    location?: string;
    preferredLanguage?: string; // Use string to accommodate various language codes/names
    culturalBackground?: string;
    interests?: string[];
    comfortEnvironment?: string;
    previousSessions?: number;
  };
  currentState: {
    mood?: string;
    stressLevel?: 'low' | 'moderate' | 'high' | 'severe';
    energyLevel?: 'low' | 'moderate' | 'high';
    crisisRisk?: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    emotionalTone?: string;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    metadata?: any;
  }>;
  therapeuticGoals?: string[];
  assessmentScores?: {
    phq9?: number;
    gad7?: number;
    overallWellness?: number;
  };
}

export interface AIResponse {
  message: string;
  originalLanguage: string;
  detectedLanguage?: string; // Language detected in the user message (e.g., "Hindi", "Bengali", "English", "Hinglish/Mixed")
  translatedMessage?: string;
  emotionalTone: 'supportive' | 'empathetic' | 'encouraging' | 'calming' | 'urgent';
  suggestedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    category: 'immediate' | 'short_term' | 'long_term';
  }>;
  copingStrategies: string[];
  followUpQuestions: string[];
  riskAssessment: {
    level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    indicators: string[];
    recommendedIntervention: string;
  };
  culturalReferences: string[];
  audioResponse?: string; // Base64 encoded audio
  confidence: number;
}

export class GoogleCloudMentalHealthAI {
  private model: any;
  private isInitialized = false;

  constructor() {
    this.initializeServices();
  }

  // Compatibility method for aiOrchestrator - matches geminiAI interface
  async generateEmpathicResponse(
    userMessage: string,
    context: {
      userMood: string;
      preferredLanguage: string;
      culturalBackground: string;
      previousMessages: string[];
      userPreferences: {
        interests: string[];
        comfortEnvironment: string;
        avatarStyle: string;
      };
      crisisLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    }
  ): Promise<{
    message: string;
    suggestedActions: string[];
    moodAssessment: string;
    followUpQuestions: string[];
  }> {
    // Convert simple context to rich MentalHealthContext
    const richContext: MentalHealthContext = {
      userId: 'current-user',
      sessionId: 'current-session',
      userProfile: {
        age: 25,
        gender: 'unknown',
        location: 'India',
        preferredLanguage: context.preferredLanguage || 'mixed',
        culturalBackground: context.culturalBackground,
        interests: context.userPreferences.interests,
        comfortEnvironment: context.userPreferences.comfortEnvironment,
        previousSessions: context.previousMessages.length
      },
      currentState: {
        mood: context.userMood,
        stressLevel: context.crisisLevel === 'none' ? 'low' :
          context.crisisLevel === 'severe' ? 'severe' : 'moderate',
        energyLevel: 'moderate',
        crisisRisk: context.crisisLevel,
        emotionalTone: context.userMood
      },
      conversationHistory: context.previousMessages.map((msg, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: msg,
        timestamp: new Date()
      })),
      therapeuticGoals: [],
      assessmentScores: {
        phq9: 0,
        gad7: 0,
        overallWellness: 50
      }
    };

    // Use the comprehensive generateEmpathicResponse method
    const response = await this.generateEmpathicResponse_Full(userMessage, richContext);

    // Convert back to simple interface for orchestrator compatibility
    return {
      message: response.message,
      suggestedActions: response.suggestedActions.map(action =>
        typeof action === 'string' ? action : action.action
      ),
      moodAssessment: response.riskAssessment.level,
      followUpQuestions: response.followUpQuestions
    };
  }

  // Comprehensive method with full MentalHealthContext
  async generateEmpathicResponse_Full(
    userMessage: string,
    context: MentalHealthContext
  ): Promise<AIResponse> {
    if (!this.isInitialized) {
      // Attempt re-initialization once if needed
      await this.initializeServices();
      if (!this.isInitialized || !this.model) {
        console.log('🔄 Using fallback response (initialization failed)');
        return this.getFallbackResponse(context);
      }
    }

    // If we're in demo mode or don't have a valid model, use fallback
    if (GEMINI_API_KEY === 'demo-key' || !this.model) {
      console.log('🔄 Using fallback response (demo mode or no valid API key)');
      return this.getFallbackResponse(context);
    }

    try {
      const prompt = this.buildAdvancedTherapeuticPrompt(userMessage, context);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Response timeout')), 30000)); // 30s timeout
      const generationPromise = this.model.generateContent(prompt);
      const result = await Promise.race([generationPromise, timeoutPromise]) as any;

      // Add check for safety feedback or blocked response
      if (!result?.response) {
        throw new Error("No response received from model (potentially blocked or empty).");
      }

      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText || generatedText.trim() === '') {
        throw new Error("Received empty text response from model.");
      }


      const structuredResponse = await this.parseAndEnhanceResponse(generatedText, context, context.userProfile?.preferredLanguage || 'mixed');
      return structuredResponse;

    } catch (error: any) {
      console.error('❌ Error generating empathic response:', error);
      // Log specific Gemini errors if available (e.g., safety blocks)
      if (error.message?.includes('SAFETY')) {
        console.error('Safety settings may have blocked the response.');
      }
      console.log('🔄 Using fallback response due to error');
      return this.getFallbackResponse(context);
    }
  }

  private async initializeServices() {
    if (this.isInitialized) return; // Prevent re-initialization
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-key') {
        console.warn('⚠️ Using demo mode - AI responses will be fallback responses only');
        this.isInitialized = true; // Set to true to allow fallback usage
        return;
      }
      if (!genAI) { // Initialize client if not already done
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      }

      // Initialize Gemini model for browser - optimized for speed
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', // CONSISTENT MODEL CHOICE (Adjust if Pro is needed AND available)
        generationConfig: {
          maxOutputTokens: 4096, // Increased token limit
          temperature: 0.3,
          topP: 0.8,
          topK: 20,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      this.isInitialized = true;
      console.log('✅ Google AI services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google AI services:', error);
      console.warn('⚠️ Falling back to demo mode');
      this.isInitialized = true; // Set to true so we use fallback responses
    }
  }

  private buildAdvancedTherapeuticPrompt(userMessage: string, context: MentalHealthContext): string {
    // Determine user's language preference and create clear instructions
    const preferredLanguage = context.userProfile?.preferredLanguage || 'mixed';

    // List of supported Indian languages for detection
    const supportedLanguages = [
      "English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil",
      "Gujarati", "Kannada", "Malayalam", "Urdu", "Punjabi", "Odia",
      "Assamese", "Hinglish/Mixed"
    ];

    // Create language preference description
    let languagePreferenceDescription = `User's general preference is ${preferredLanguage}.`;
    if (preferredLanguage === 'mixed') {
      languagePreferenceDescription = 'User is comfortable with a mix of Hindi and English (Hinglish).';
    } else if (preferredLanguage === 'hi' || preferredLanguage === 'hi-IN') {
      languagePreferenceDescription = 'User prefers Hindi.';
    } else if (preferredLanguage === 'en' || preferredLanguage === 'en-IN') {
      languagePreferenceDescription = 'User prefers English.';
    }

    // Create comprehensive language instructions
    const languageInstructions = `
LANGUAGE INSTRUCTIONS (CRITICAL - READ CAREFULLY):
1. **SUPPORTED LANGUAGES**: ${supportedLanguages.join(', ')}.

2. **ANALYZE USER MESSAGE LANGUAGE**: Examine the user's message below and identify the primary language from the SUPPORTED LANGUAGES list. Pay close attention to script and vocabulary:
   - English: Primarily English words and grammar
   - Hindi: Primarily Hindi/Devanagari script
   - Bengali: Bengali script (বাংলা)
   - Tamil: Tamil script (தமிழ்)
   - Telugu: Telugu script (తెలుగు)
   - Marathi: Devanagari script with Marathi vocabulary
   - Gujarati: Gujarati script (ગુજરાતી)
   - Kannada: Kannada script (ಕನ್ನಡ)
   - Malayalam: Malayalam script (മലയാളം)
   - Punjabi: Gurmukhi script (ਪੰਜਾਬੀ)
   - Urdu: Arabic script (اردو)
   - Odia: Odia script (ଓଡ଼ିଆ)
   - Assamese: Assamese script (অসমীয়া)
   - Hinglish/Mixed: Mix of Hindi and English or switching between languages

3. **MIRROR THE USER'S LANGUAGE EXACTLY**: 
   - **RESPOND *ONLY* IN THE DETECTED LANGUAGE** from the user's message
   - Match their exact style and mixing pattern if applicable
   - If they use regional language, respond in that same regional language
   - If they use Hinglish, respond in Hinglish with similar mixing pattern

4. **LANGUAGE CONSISTENCY RULES**:
   - DO NOT translate unless specifically requested
   - DO NOT assume language from profile if current message differs
   - ${languagePreferenceDescription} However, **ALWAYS prioritize responding in the language used in the *current* user message**
   - Be natural and conversational in whatever language they use

5. **EXAMPLES**:
   - User: "I'm feeling anxious" → Respond in English
   - User: "मैं परेशान हूँ" → Respond in Hindi
   - User: "আমি চিন্তিত" → Respond in Bengali
   - User: "నేను ఆందోళనగా ఉన్నాను" → Respond in Telugu
   - User: "I'm feeling बहुत stressed" → Respond in Hinglish
   - User: "Today was tough. कल better होगा" → Match this mixed pattern`;

    return `
You are "MannMitra" (मन मित्र), an advanced AI mental health companion specifically designed for Indian youth. You provide comprehensive, empathetic, and culturally sensitive mental health support.

${languageInstructions}

COMPREHENSIVE USER CONTEXT:
Demographics:
- Age: ${context.userProfile?.age || 'Unknown'}
- Gender: ${context.userProfile?.gender || 'Unknown'}
- Location: ${context.userProfile?.location || 'Unknown'}
- Cultural Background: ${context.userProfile?.culturalBackground || 'Indian'}
- Preferred Language: ${context.userProfile?.preferredLanguage || 'mixed'}
- Previous Sessions: ${context.userProfile?.previousSessions || 0}

Current Mental State:
- Mood: ${context.currentState?.mood || 'neutral'}
- Stress Level: ${context.currentState?.stressLevel || 'moderate'}
- Energy Level: ${context.currentState?.energyLevel || 'moderate'}
- Crisis Risk: ${context.currentState?.crisisRisk || 'none'}
- Emotional Tone: ${context.currentState?.emotionalTone || 'neutral'}

Assessment Scores:
- PHQ-9 (Depression): ${context.assessmentScores?.phq9 || 0}/27
- GAD-7 (Anxiety): ${context.assessmentScores?.gad7 || 0}/21
- Overall Wellness: ${context.assessmentScores?.overallWellness || 50}/100

Therapeutic Goals: ${context.therapeuticGoals?.join(', ') || 'General wellness'}

Recent Conversation History:
${context.conversationHistory?.slice(-5).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'No previous conversation'}

CULTURAL SENSITIVITY GUIDELINES:
- Understand Indian family dynamics, academic pressure, and social expectations
- Be aware of mental health stigma in Indian society
- Reference appropriate cultural concepts: dharma, karma, family honor, community support
- Use respectful language addressing generational differences
- Acknowledge festivals, traditions, and spiritual beliefs
- Understand concepts like "log kya kahenge" (what will people say)
- Be sensitive to economic disparities and accessibility issues

THERAPEUTIC APPROACH:
Based on the user's current state and history, employ:
1. Cognitive Behavioral Therapy (CBT) techniques for thought restructuring
2. Dialectical Behavior Therapy (DBT) skills for emotional regulation
3. Mindfulness and meditation practices adapted for Indian context
4. Solution-focused brief therapy for goal-oriented support
5. Narrative therapy to help reframe personal stories
6. Cultural adaptation of Western therapeutic models

CRISIS ASSESSMENT:
Current Risk Level: ${context.currentState?.crisisRisk || 'none'}
${(context.currentState?.crisisRisk || 'none') !== 'none' ? `
IMPORTANT: User shows ${context.currentState?.crisisRisk || 'none'} crisis risk. 
- Provide immediate safety planning
- Offer crisis resources (Indian helplines: AASRA 91-22-27546669, Vandrevala 9999 666 555)
- Use de-escalation techniques
- Encourage professional help
- Follow up with safety checks
` : ''}

USER MESSAGE: "${userMessage}"

RESPONSE REQUIREMENTS:
Generate a comprehensive therapeutic response in JSON format. The "message" field MUST follow the language instructions above - mirror the user's language exactly.

{
  "message": "Your empathetic, culturally sensitive response (150-200 words) - MUST be in the same language as user's message",
  "detectedLanguage": "The name of the language you detected in the user message from the SUPPORTED LANGUAGES list (e.g., 'Hindi', 'Bengali', 'English', 'Hinglish/Mixed')",
  "emotionalTone": "supportive|empathetic|encouraging|calming|urgent",
  "suggestedActions": [
    {
      "action": "Specific actionable step",
      "priority": "high|medium|low",
      "category": "immediate|short_term|long_term"
    }
  ],
  "copingStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
  "followUpQuestions": ["Question 1", "Question 2"],
  "riskAssessment": {
    "level": "none|low|moderate|high|severe",
    "indicators": ["Indicator 1", "Indicator 2"],
    "recommendedIntervention": "Specific recommendation"
  },
  "culturalReferences": ["Relevant cultural element or wisdom"],
  "confidence": 0.85
}

FINAL REMINDER: The "message" field must be in the EXACT SAME LANGUAGE as the user's message. Do not translate, do not assume - mirror their language choice precisely.

Remember: You are not just providing information, but engaging in a therapeutic relationship that honors the user's cultural identity while providing evidence-based mental health support.
`;
  }

  private async parseAndEnhanceResponse(
    generatedText: string,
    context: MentalHealthContext,
    originalLanguage: string
  ): Promise<AIResponse> {
    try {
      // Try to parse JSON response
      const cleanedResponse = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      // Enhance with additional processing
      const enhanced: AIResponse = {
        message: parsed.message,
        originalLanguage,
        detectedLanguage: parsed.detectedLanguage || 'Unknown',
        emotionalTone: parsed.emotionalTone || 'supportive',
        suggestedActions: parsed.suggestedActions || [],
        copingStrategies: parsed.copingStrategies || [],
        followUpQuestions: parsed.followUpQuestions || [],
        riskAssessment: parsed.riskAssessment || {
          level: 'none',
          indicators: [],
          recommendedIntervention: 'Continue supportive conversation'
        },
        culturalReferences: parsed.culturalReferences || [],
        confidence: parsed.confidence || 0.8
      };

      return enhanced;
    } catch (error) {
      // *** ADD LOGGING HERE ***
      console.error('❌ Error parsing AI response:', error);
      console.error('� iProblematic Text:', generatedText); // Log the text that caused the error
      console.log('🔄 Using fallback response due to parsing error'); // Make log clearer
      return this.getFallbackResponse(context); // Continue returning fallback for now
    }
  }

  private getFallbackResponse(context: MentalHealthContext): AIResponse {
    const language = context.userProfile?.preferredLanguage || 'mixed';

    const fallbackMessages = {
      en: "I'm here to listen and support you. Your feelings are valid, and you're not alone in this journey. Let's work through this together.",
      hi: "मैं यहाँ आपको सुनने और सहारा देने के लिए हूँ। आपकी भावनाएं सही हैं, और इस सफर में आप अकेले नहीं हैं। आइए मिलकर इसका समाधान करते हैं।",
      mixed: "मैं यहाँ हूँ आपके साथ। Your feelings are valid और आप alone नहीं हैं। Let's work through this together।"
    };

    return {
      message: fallbackMessages[language as keyof typeof fallbackMessages] || fallbackMessages.en,
      originalLanguage: language,
      detectedLanguage: 'Unknown',
      emotionalTone: 'supportive',
      suggestedActions: [
        {
          action: 'Take 5 deep breaths / 5 गहरी सांसें लें',
          priority: 'high',
          category: 'immediate'
        }
      ],
      copingStrategies: ['Deep breathing', 'Mindful observation', 'Gentle self-talk'],
      followUpQuestions: ['How are you feeling right now?', 'What would help you most today?'],
      riskAssessment: {
        level: 'none',
        indicators: [],
        recommendedIntervention: 'Continue supportive conversation'
      },
      culturalReferences: ['Remember: हर रात के बाद सुबह होती है (After every night comes morning)'],
      confidence: 0.7
    };
  }
}

// Export singleton instance
export const googleCloudAI = new GoogleCloudMentalHealthAI();