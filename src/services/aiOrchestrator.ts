// AI Orchestrator - Coordinates all AI services for comprehensive mental health support
// Integrates emotion detection, voice analysis, cultural context, and therapeutic interventions

import { geminiAI, type ConversationContext as GeminiContext } from './geminiAI';


export interface TherapeuticResponse {
  message: string;
  interventionType: 'validation' | 'cognitive_restructuring' | 'mindfulness' | 'crisis_intervention' | 'psychoeducation' | 'behavioral_activation';
  culturalAdaptation: {
    language: 'hindi' | 'english' | 'mixed';
    culturalReferences: string[];
    respectLevel: 'formal' | 'casual' | 'mixed';
  };
  emotionalSupport: {
    empathyLevel: number;
    validationStrategies: string[];
    copingStrategies: string[];
  };
  riskAssessment: {
    level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    indicators: string[];
    immediateActions: string[];
    confidence?: number;
  };
  followUp: {
    recommended: boolean;
    timeframe: string;
    focus: string[];
  };
  resources: {
    selfHelp: string[];
    professional: string[];
    emergency: string[];
  };
}

export interface UserContext {
  userId: string;
  demographics: {
    age?: number;
    gender?: string;
    location?: string;
    language?: string;
    culturalBackground?: string;
  };
  mentalHealthHistory: {
    previousSessions: number;
    primaryConcerns: string[];
    therapeuticGoals: string[];
    riskFactors: string[];
    protectiveFactors: string[];
  };
  currentState: {
    emotionalState?: any;
    stressLevel?: number;
    recentTriggers?: string[];
    copingStrategies?: string[];
  };
}

export interface ConversationContext {
  sessionId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    emotionalAnalysis?: any;
  }>;
  currentTopic?: string;
  therapeuticPhase: 'rapport_building' | 'assessment' | 'intervention' | 'consolidation' | 'closure';
  culturalContext: {
    languagePreference: string;
    culturalSensitivities: string[];
    communicationStyle: string;
  };
}

export class AIOrchestrator {
  private activeContexts: Map<string, ConversationContext> = new Map();
  private userProfiles: Map<string, UserContext> = new Map();
  private interventionStrategies: Map<string, any> = new Map();

  constructor() {
    this.initializeInterventionStrategies();
    console.log('🧠 AI Orchestrator initialized');
  }

  // Main method to generate therapeutic responses
  async generateTherapeuticResponse(
    userMessage: string,
    userId: string,
    context: {
      session?: any;
      emotionalAnalysis?: any;
      riskAssessment?: any;
      adaptations?: any[];
    } = {}
  ): Promise<TherapeuticResponse> {
    try {
      // Get or create user context
      const userContext = await this.getUserContext(userId);
      const conversationContext = await this.getConversationContext(context.session?.sessionId || 'default', userId);

      // Analyze user message comprehensively
      const messageAnalysis = await this.analyzeUserMessage(userMessage, userContext, conversationContext);

      // Determine intervention strategy
      const interventionStrategy = await this.determineInterventionStrategy(
        messageAnalysis,
        userContext,
        context.riskAssessment
      );

      // Generate culturally adapted response
      const response = await this.generateCulturallyAdaptedResponse(
        userMessage,
        messageAnalysis,
        interventionStrategy,
        userContext,
        conversationContext
      );

      // Update conversation context
      this.updateConversationContext(conversationContext, userMessage, response, messageAnalysis);

      return response;
    } catch (error) {
      console.error('AI Orchestrator error:', error);
      return this.generateFallbackResponse(userMessage, userId);
    }
  }

  // Analyze user message using multiple AI services
  private async analyzeUserMessage(
    message: string,
    userContext: UserContext,
    conversationContext: ConversationContext
  ): Promise<any> {
    const analysis = {
      textAnalysis: {},
      emotionalAnalysis: {},
      culturalAnalysis: {},
      riskAnalysis: {},
      therapeuticNeeds: []
    };

    try {
      // Basic text analysis using Gemini
      analysis.textAnalysis = await this.analyzeTextContent(message);

      // Emotional analysis
      analysis.emotionalAnalysis = await this.analyzeEmotionalContent(message);

      // Cultural context analysis
      analysis.culturalAnalysis = await this.analyzeCulturalContext(message, userContext);

      // Risk assessment
      analysis.riskAnalysis = await this.assessRiskFactors(message, userContext, conversationContext);

      // Identify therapeutic needs
      analysis.therapeuticNeeds = await this.identifyTherapeuticNeeds(message, analysis) as never[];

      return analysis;
    } catch (error) {
      console.error('Message analysis error:', error);
      return analysis;
    }
  }

  private async analyzeTextContent(message: string): Promise<any> {
    try {
      // Use real text analysis instead of calling Gemini for basic analysis
      const words = message.split(/\s+/).filter(w => w.length > 0);
      const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);

      // Extract themes
      const themes = this.extractThemes(message);

      // Identify emotions
      const emotions = this.identifyEmotions(message);

      // Analyze cognitive patterns
      const cognitivePatterns = this.analyzeCognitivePatterns(message);

      // Identify behavioral indicators
      const behavioralIndicators = this.identifyBehavioralIndicators(message);

      // Identify strengths
      const strengths = this.identifyStrengths(message);

      return {
        themes,
        emotions,
        cognitivePatterns,
        behavioralIndicators,
        strengths,
        wordCount: words.length,
        sentenceCount: sentences.length,
        complexity: sentences.length > 0 ? words.length / sentences.length : 0
      };
    } catch (error) {
      console.error('Text analysis error:', error);
      return {
        themes: [],
        emotions: [],
        cognitivePatterns: [],
        behavioralIndicators: [],
        strengths: []
      };
    }
  }

  private extractThemes(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const themes: string[] = [];

    const themeKeywords = {
      family: ['family', 'parents', 'mom', 'dad', 'परिवार', 'माता-पिता'],
      work: ['work', 'job', 'career', 'office', 'काम', 'नौकरी'],
      relationships: ['friend', 'relationship', 'love', 'दोस्त', 'रिश्ता'],
      health: ['health', 'sick', 'tired', 'स्वास्थ्य', 'बीमार'],
      education: ['study', 'exam', 'school', 'college', 'पढ़ाई', 'परीक्षा'],
      money: ['money', 'financial', 'expensive', 'पैसा', 'आर्थिक']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes;
  }

  private identifyEmotions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const emotions: string[] = [];

    const emotionKeywords = {
      anxiety: ['worried', 'nervous', 'anxious', 'panic', 'चिंता', 'घबराहट'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'उदास', 'निराश'],
      stress: ['stressed', 'overwhelmed', 'pressure', 'तनाव', 'दबाव'],
      anger: ['angry', 'frustrated', 'mad', 'irritated', 'गुस्सा', 'नाराज'],
      joy: ['happy', 'excited', 'good', 'great', 'खुश', 'अच्छा'],
      fear: ['scared', 'afraid', 'terrified', 'डर', 'भयभीत']
    };

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        emotions.push(emotion);
      }
    });

    return emotions;
  }

  private analyzeCognitivePatterns(message: string): string[] {
    const patterns: string[] = [];
    const lowerMessage = message.toLowerCase();

    // All-or-nothing thinking
    if (lowerMessage.includes('always') || lowerMessage.includes('never') ||
      lowerMessage.includes('हमेशा') || lowerMessage.includes('कभी नहीं')) {
      patterns.push('all_or_nothing_thinking');
    }

    // Catastrophizing
    if (lowerMessage.includes('worst') || lowerMessage.includes('terrible') ||
      lowerMessage.includes('disaster') || lowerMessage.includes('बर्बाद')) {
      patterns.push('catastrophizing');
    }

    // Mind reading
    if (lowerMessage.includes('they think') || lowerMessage.includes('everyone thinks') ||
      lowerMessage.includes('लोग सोचते हैं')) {
      patterns.push('mind_reading');
    }

    return patterns;
  }

  private identifyBehavioralIndicators(message: string): string[] {
    const indicators: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Avoidance
    if (lowerMessage.includes('avoid') || lowerMessage.includes('skip') ||
      lowerMessage.includes('बचना') || lowerMessage.includes('छोड़ना')) {
      indicators.push('avoidance');
    }

    // Social withdrawal
    if (lowerMessage.includes('alone') || lowerMessage.includes('isolate') ||
      lowerMessage.includes('अकेला') || lowerMessage.includes('अलग')) {
      indicators.push('social_withdrawal');
    }

    // Sleep issues
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') ||
      lowerMessage.includes('नींद') || lowerMessage.includes('अनिद्रा')) {
      indicators.push('sleep_disturbance');
    }

    return indicators;
  }

  private identifyStrengths(message: string): string[] {
    const strengths: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Seeking help
    if (lowerMessage.includes('help') || lowerMessage.includes('support') ||
      lowerMessage.includes('मदद') || lowerMessage.includes('सहारा')) {
      strengths.push('help_seeking');
    }

    // Self-awareness
    if (lowerMessage.includes('realize') || lowerMessage.includes('understand') ||
      lowerMessage.includes('समझना') || lowerMessage.includes('एहसास')) {
      strengths.push('self_awareness');
    }

    // Resilience
    if (lowerMessage.includes('try') || lowerMessage.includes('effort') ||
      lowerMessage.includes('कोशिश') || lowerMessage.includes('प्रयास')) {
      strengths.push('resilience');
    }

    return strengths;
  }

  private async analyzeEmotionalContent(message: string): Promise<any> {
    // Use emotion detection service for comprehensive emotional analysis
    const emotionalKeywords = {
      anxiety: ['worried', 'nervous', 'scared', 'panic', 'चिंता', 'घबराहट'],
      depression: ['sad', 'hopeless', 'empty', 'worthless', 'उदास', 'निराश'],
      stress: ['overwhelmed', 'pressure', 'burden', 'तनाव', 'दबाव'],
      anger: ['frustrated', 'angry', 'mad', 'irritated', 'गुस्सा', 'नाराज'],
      joy: ['happy', 'excited', 'good', 'great', 'खुश', 'अच्छा']
    };

    const lowerMessage = message.toLowerCase();
    const detectedEmotions: any = {};

    Object.entries(emotionalKeywords).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
      if (matches.length > 0) {
        detectedEmotions[emotion] = {
          intensity: Math.min(1, matches.length * 0.3),
          keywords: matches
        };
      }
    });

    return {
      primaryEmotion: Object.keys(detectedEmotions)[0] || 'neutral',
      emotionIntensity: Math.max(...Object.values(detectedEmotions).map((e: any) => e.intensity), 0.1),
      detectedEmotions,
      valence: this.calculateValence(detectedEmotions),
      arousal: this.calculateArousal(detectedEmotions)
    };
  }

  private async analyzeCulturalContext(message: string, _userContext: UserContext): Promise<any> {
    const culturalIndicators = {
      familyReferences: ['family', 'parents', 'mom', 'dad', 'परिवार', 'माता-पिता', 'मम्मी', 'पापा'],
      socialPressure: ['society', 'log kya kahenge', 'people say', 'समाज', 'लोग क्या कहेंगे'],
      academicPressure: ['studies', 'exam', 'marks', 'career', 'पढ़ाई', 'परीक्षा', 'नंबर'],
      religiousReferences: ['god', 'prayer', 'temple', 'भगवान', 'प्रार्थना', 'मंदिर'],
      languageMixing: this.detectLanguageMixing(message)
    };

    const lowerMessage = message.toLowerCase();
    const culturalContext: any = {
      languagePreference: this.detectLanguagePreference(message),
      culturalThemes: [],
      formalityLevel: this.detectFormalityLevel(message),
      generationalFactors: []
    };

    Object.entries(culturalIndicators).forEach(([theme, indicators]) => {
      if (Array.isArray(indicators)) {
        const matches = indicators.filter(indicator => lowerMessage.includes(indicator));
        if (matches.length > 0) {
          culturalContext.culturalThemes.push(theme);
        }
      } else if (indicators > 0.3) {
        culturalContext.culturalThemes.push(theme);
      }
    });

    return culturalContext;
  }

  private async assessRiskFactors(
    message: string,
    userContext: UserContext,
    _conversationContext: ConversationContext
  ): Promise<any> {
    const riskIndicators = {
      suicidalIdeation: ['suicide', 'kill myself', 'end it all', 'आत्महत्या', 'मरना चाहता'],
      selfHarm: ['hurt myself', 'cut', 'harm', 'खुद को नुकसान'],
      hopelessness: ['no hope', 'pointless', 'no future', 'कोई उम्मीद नहीं', 'बेकार'],
      isolation: ['alone', 'no one', 'lonely', 'अकेला', 'कोई नहीं'],
      substanceUse: ['drink', 'drugs', 'alcohol', 'शराब', 'नशा']
    };

    const protectiveFactors = {
      socialSupport: ['friends', 'family', 'support', 'दोस्त', 'परिवार', 'सहारा'],
      copingStrategies: ['meditation', 'exercise', 'music', 'ध्यान', 'व्यायाम'],
      futureOrientation: ['future', 'goals', 'dreams', 'भविष्य', 'सपने'],
      helpSeeking: ['help', 'therapy', 'counseling', 'मदद', 'सलाह']
    };

    const lowerMessage = message.toLowerCase();
    const riskAssessment = {
      level: 'none' as 'none' | 'low' | 'moderate' | 'high' | 'severe',
      indicators: [] as string[],
      protectiveFactors: [] as string[],
      immediateIntervention: false
    };

    // Check for risk indicators
    Object.entries(riskIndicators).forEach(([risk, keywords]) => {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
      if (matches.length > 0) {
        riskAssessment.indicators.push(risk);
      }
    });

    // Check for protective factors
    Object.entries(protectiveFactors).forEach(([factor, keywords]) => {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
      if (matches.length > 0) {
        riskAssessment.protectiveFactors.push(factor);
      }
    });

    // Determine risk level
    if (riskAssessment.indicators.includes('suicidalIdeation')) {
      riskAssessment.level = 'severe';
      riskAssessment.immediateIntervention = true;
    } else if (riskAssessment.indicators.length >= 2) {
      riskAssessment.level = 'high';
    } else if (riskAssessment.indicators.length === 1) {
      riskAssessment.level = 'moderate';
    } else if (userContext.mentalHealthHistory.riskFactors.length > 0) {
      riskAssessment.level = 'low';
    }

    return riskAssessment;
  }

  private async identifyTherapeuticNeeds(_message: string, analysis: any): Promise<string[]> {
    const needs: string[] = [];

    // Based on emotional analysis
    if (analysis.emotionalAnalysis.primaryEmotion === 'anxiety') {
      needs.push('anxiety_management', 'grounding_techniques');
    }
    if (analysis.emotionalAnalysis.primaryEmotion === 'depression') {
      needs.push('mood_enhancement', 'behavioral_activation');
    }
    if (analysis.emotionalAnalysis.primaryEmotion === 'stress') {
      needs.push('stress_management', 'relaxation_techniques');
    }

    // Based on risk analysis
    if (analysis.riskAnalysis.level !== 'none') {
      needs.push('crisis_intervention', 'safety_planning');
    }

    // Based on cultural context
    if (analysis.culturalAnalysis.culturalThemes.includes('familyReferences')) {
      needs.push('family_therapy_techniques');
    }
    if (analysis.culturalAnalysis.culturalThemes.includes('academicPressure')) {
      needs.push('academic_stress_management');
    }

    return needs;
  }

  private async determineInterventionStrategy(
    messageAnalysis: any,
    _userContext: UserContext,
    _riskAssessment?: any
  ): Promise<any> {
    // Crisis intervention takes priority
    if (messageAnalysis.riskAnalysis.level === 'severe') {
      return {
        primary: 'crisis_intervention',
        secondary: ['validation', 'safety_planning'],
        approach: 'directive',
        urgency: 'immediate'
      };
    }

    // High risk requires structured intervention
    if (messageAnalysis.riskAnalysis.level === 'high') {
      return {
        primary: 'risk_management',
        secondary: ['validation', 'cognitive_restructuring'],
        approach: 'supportive_directive',
        urgency: 'high'
      };
    }

    // Standard therapeutic interventions based on needs
    const primaryNeeds = messageAnalysis.therapeuticNeeds;
    let primaryIntervention = 'validation'; // Default

    if (primaryNeeds.includes('anxiety_management')) {
      primaryIntervention = 'mindfulness';
    } else if (primaryNeeds.includes('mood_enhancement')) {
      primaryIntervention = 'behavioral_activation';
    } else if (primaryNeeds.includes('stress_management')) {
      primaryIntervention = 'cognitive_restructuring';
    }

    return {
      primary: primaryIntervention,
      secondary: ['validation', 'psychoeducation'],
      approach: 'collaborative',
      urgency: 'standard'
    };
  }

  private async generateCulturallyAdaptedResponse(
    userMessage: string,
    messageAnalysis: any,
    interventionStrategy: any,
    userContext: UserContext,
    _conversationContext: ConversationContext
  ): Promise<TherapeuticResponse> {
    // Build culturally sensitive prompt
    const culturalContext = messageAnalysis.culturalAnalysis;
    const languagePreference = culturalContext.languagePreference;
    const culturalThemes = culturalContext.culturalThemes;

    // Detect user's preferred response format
    const responseFormat = this.detectResponseFormat(userMessage);

    let prompt = `
      You are MannMitra, a professional AI mental health companion designed for Indian youth. You provide comprehensive, empathetic, and culturally sensitive mental health support.
      
      User message: "${userMessage}"
      
      Context:
      - Primary emotion: ${messageAnalysis.emotionalAnalysis.primaryEmotion}
      - Risk level: ${messageAnalysis.riskAnalysis.level}
      - Intervention needed: ${interventionStrategy.primary}
      - Requested response format: ${responseFormat.type}
      
      RESPONSE REQUIREMENTS:
      - Provide concise but comprehensive responses (80-150 words) that address the user's concerns thoroughly
      - Show deep understanding of their emotional state and situation
      - Offer 2-3 practical, actionable coping strategies (not too many)
      - Include key therapeutic insights and explanations
      - Use professional but warm, empathetic language
      - Be culturally sensitive to Indian context
      - DO NOT include repetitive greetings or phrases
      - DO NOT repeat content from previous responses
      - Be direct and specific to their current message
      - Keep responses focused and to the point
      
      Guidelines:
      1. Address their specific concerns with depth and insight
      2. Provide practical, immediately actionable coping strategies
      3. Show genuine understanding and empathy
      4. Use evidence-based therapeutic approaches
      5. Be culturally sensitive to Indian family dynamics and social pressures
      6. Offer hope and encouragement
      7. Use markdown formatting for better structure:
         - Use **bold** for important points
         - Use bullet points (-) for lists
         - Use numbered lists (1., 2., 3.) for steps
         - Use *italics* for emphasis
      
      ${this.getInterventionGuidelines(interventionStrategy.primary)}
      
      Generate a comprehensive therapeutic response that provides meaningful support and guidance.
    `;

    try {
      // For very short responses, use quick response generator
      if (responseFormat.type === 'one_line' || responseFormat.type === 'direct') {
        const quickResponse = this.generateQuickResponse(userMessage, messageAnalysis, responseFormat);
        if (quickResponse) {
          return {
            message: quickResponse,
            interventionType: interventionStrategy.primary,
            culturalAdaptation: {
              language: languagePreference,
              culturalReferences: culturalThemes,
              respectLevel: 'casual'
            },
            emotionalSupport: {
              empathyLevel: 0.8,
              validationStrategies: ['acknowledge_feelings'],
              copingStrategies: this.getCopingStrategies(messageAnalysis)
            },
            riskAssessment: {
              level: messageAnalysis.riskAnalysis.level,
              indicators: messageAnalysis.riskAnalysis.indicators,
              immediateActions: this.getImmediateActions(messageAnalysis.riskAnalysis)
            },
            followUp: {
              recommended: false,
              timeframe: 'as needed',
              focus: []
            },
            resources: {
              selfHelp: this.getSelfHelpResources(messageAnalysis),
              professional: this.getProfessionalResources(culturalContext),
              emergency: this.getEmergencyResources()
            }
          };
        }
      }

      const context: GeminiContext = {
        userMood: messageAnalysis.emotionalAnalysis.primaryEmotion || 'neutral',
        preferredLanguage: languagePreference === 'hindi' ? 'hindi' :
          languagePreference === 'mixed' ? 'mixed' : 'english',
        culturalBackground: 'indian',
        previousMessages: [],
        userPreferences: {
          interests: [],
          comfortEnvironment: '',
          avatarStyle: ''
        },
        crisisLevel: messageAnalysis.riskAnalysis.level
      };

      const response = await geminiAI.generateEmpathicResponse(prompt, context);

      return {
        message: response.message || this.getFallbackMessage(messageAnalysis),
        interventionType: interventionStrategy.primary,
        culturalAdaptation: {
          language: languagePreference,
          culturalReferences: culturalThemes,
          respectLevel: culturalContext.formalityLevel > 0.7 ? 'formal' : 'casual'
        },
        emotionalSupport: {
          empathyLevel: this.calculateEmpathyLevel(messageAnalysis),
          validationStrategies: this.getValidationStrategies(messageAnalysis),
          copingStrategies: this.getCopingStrategies(messageAnalysis)
        },
        riskAssessment: {
          level: messageAnalysis.riskAnalysis.level,
          indicators: messageAnalysis.riskAnalysis.indicators,
          immediateActions: this.getImmediateActions(messageAnalysis.riskAnalysis)
        },
        followUp: {
          recommended: messageAnalysis.riskAnalysis.level !== 'none',
          timeframe: this.getFollowUpTimeframe(messageAnalysis.riskAnalysis.level),
          focus: messageAnalysis.therapeuticNeeds
        },
        resources: {
          selfHelp: this.getSelfHelpResources(messageAnalysis),
          professional: this.getProfessionalResources(culturalContext),
          emergency: this.getEmergencyResources()
        }
      };
    } catch (error) {
      console.error('Response generation error:', error);
      return this.generateFallbackResponse(userMessage, userContext.userId);
    }
  }

  // Generate quick, direct responses for users who want short answers
  private generateQuickResponse(userMessage: string, messageAnalysis: any, _responseFormat: any): string | null {
    const lowerMessage = userMessage.toLowerCase();
    const primaryEmotion = messageAnalysis.emotionalAnalysis.primaryEmotion;

    // Quick responses for common situations
    if (lowerMessage.includes("don't feel good") || lowerMessage.includes("not feeling good")) {
      const quickResponses = [
        "Try deep breathing for 2 minutes - it really helps.",
        "Take a 5-minute walk outside if you can.",
        "Listen to your favorite song right now.",
        "Call someone you trust and talk for a few minutes.",
        "Write down 3 things you're grateful for today."
      ];
      return quickResponses[Math.floor(Math.random() * quickResponses.length)] || "Try deep breathing for 2 minutes - it really helps.";
    }

    if (lowerMessage.includes("stressed") || lowerMessage.includes("tension")) {
      return "Try the 4-7-8 breathing: breathe in for 4, hold for 7, out for 8.";
    }

    if (lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
      return "Ground yourself: name 5 things you see, 4 you can touch, 3 you hear.";
    }

    if (lowerMessage.includes("sad") || lowerMessage.includes("down")) {
      return "It's okay to feel sad. Do one small thing that usually makes you smile.";
    }

    if (lowerMessage.includes("angry") || lowerMessage.includes("frustrated")) {
      return "Count to 10 slowly, then take 3 deep breaths before reacting.";
    }

    if (lowerMessage.includes("can't sleep") || lowerMessage.includes("insomnia")) {
      return "Try progressive muscle relaxation: tense and release each muscle group.";
    }

    if (lowerMessage.includes("overwhelmed")) {
      return "Pick just ONE small task to do right now. Ignore the rest for now.";
    }

    // Emotion-based quick responses
    if (primaryEmotion === 'anxiety') {
      return "Focus on your breathing - slow and steady helps calm anxiety.";
    }

    if (primaryEmotion === 'depression') {
      return "Take it one moment at a time. You don't have to feel better all at once.";
    }

    if (primaryEmotion === 'stress') {
      return "Step away from what's stressing you for 5 minutes if possible.";
    }

    // Default quick response for "what can I do" type questions
    if (lowerMessage.includes("what can i do") || lowerMessage.includes("what should i do")) {
      return "Start with deep breathing, then do one small thing that usually helps you feel better.";
    }

    return null;
  }

  // Detect user's preferred response format
  private detectResponseFormat(message: string): { type: string; instruction: string } {
    const lowerMessage = message.toLowerCase();

    // Check for specific length requests
    if (lowerMessage.includes('one line') || lowerMessage.includes('1 line') ||
      lowerMessage.includes('single line') || lowerMessage.includes('just one line')) {
      return {
        type: 'one_line',
        instruction: 'Respond in EXACTLY ONE LINE only. Maximum 15-20 words. Be direct and helpful.'
      };
    }

    if (lowerMessage.includes('short') || lowerMessage.includes('brief') ||
      lowerMessage.includes('quick') || lowerMessage.includes('concise')) {
      return {
        type: 'short',
        instruction: 'Keep response concise but still helpful - 2-3 sentences with practical advice.'
      };
    }

    if (lowerMessage.includes('detailed') || lowerMessage.includes('explain') ||
      lowerMessage.includes('tell me more') || lowerMessage.includes('elaborate')) {
      return {
        type: 'detailed',
        instruction: 'Provide a detailed, comprehensive response with thorough explanations and multiple coping strategies.'
      };
    }

    if (lowerMessage.includes('bullet') || lowerMessage.includes('list') ||
      lowerMessage.includes('points')) {
      return {
        type: 'list',
        instruction: 'Respond in bullet points or numbered list format with clear, actionable steps.'
      };
    }

    // Check for frustration with long responses
    if (lowerMessage.includes('too long') || lowerMessage.includes('bullshit') ||
      lowerMessage.includes('proper answer') || lowerMessage.includes('straight answer')) {
      return {
        type: 'direct',
        instruction: 'Give a direct, straight answer with practical advice. Be concise but helpful.'
      };
    }

    // Default format - provide comprehensive support
    return {
      type: 'comprehensive',
      instruction: 'Provide a comprehensive, empathetic response that addresses their concerns with depth and offers practical guidance.'
    };
  }

  // Helper methods
  private calculateValence(emotions: any): number {
    const positiveEmotions = ['joy', 'excitement', 'hope'];
    const negativeEmotions = ['sadness', 'anxiety', 'anger', 'depression'];

    let positiveScore = 0;
    let negativeScore = 0;

    Object.keys(emotions).forEach(emotion => {
      if (positiveEmotions.includes(emotion)) {
        positiveScore += emotions[emotion].intensity;
      } else if (negativeEmotions.includes(emotion)) {
        negativeScore += emotions[emotion].intensity;
      }
    });

    return (positiveScore - negativeScore) / Math.max(positiveScore + negativeScore, 1);
  }

  private calculateArousal(emotions: any): number {
    const highArousalEmotions = ['anxiety', 'anger', 'excitement', 'panic'];
    const lowArousalEmotions = ['sadness', 'depression', 'calm'];

    let arousalScore = 0.5; // neutral baseline

    Object.keys(emotions).forEach(emotion => {
      if (highArousalEmotions.includes(emotion)) {
        arousalScore += emotions[emotion].intensity * 0.3;
      } else if (lowArousalEmotions.includes(emotion)) {
        arousalScore -= emotions[emotion].intensity * 0.2;
      }
    });

    return Math.max(0, Math.min(1, arousalScore));
  }

  private detectLanguageMixing(message: string): number {
    const hindiPattern = /[\u0900-\u097F]/;
    const englishPattern = /[a-zA-Z]/;

    const hasHindi = hindiPattern.test(message);
    const hasEnglish = englishPattern.test(message);

    if (hasHindi && hasEnglish) return 0.8;
    return 0.0;
  }

  private detectLanguagePreference(message: string): 'hindi' | 'english' | 'mixed' {
    const hindiPattern = /[\u0900-\u097F]/;
    const englishPattern = /[a-zA-Z]/;

    const hasHindi = hindiPattern.test(message);
    const hasEnglish = englishPattern.test(message);

    if (hasHindi && hasEnglish) return 'mixed';
    if (hasHindi) return 'hindi';
    return 'english';
  }

  private detectFormalityLevel(message: string): number {
    const formalMarkers = ['आप', 'जी', 'sir', 'madam', 'please', 'thank you'];
    const informalMarkers = ['तू', 'तुम', 'yaar', 'bro', 'dude'];

    const lowerMessage = message.toLowerCase();
    const formalCount = formalMarkers.filter(marker => lowerMessage.includes(marker)).length;
    const informalCount = informalMarkers.filter(marker => lowerMessage.includes(marker)).length;

    return formalCount / Math.max(formalCount + informalCount, 1);
  }

  private getInterventionGuidelines(intervention: string): string {
    const guidelines = {
      validation: 'Acknowledge their feelings and normalize their experience. Show understanding.',
      cognitive_restructuring: 'Help identify negative thought patterns and suggest balanced perspectives.',
      mindfulness: 'Suggest grounding techniques and present-moment awareness practices.',
      crisis_intervention: 'Prioritize safety. Be direct but compassionate. Provide immediate resources.',
      behavioral_activation: 'Encourage small, manageable activities that can improve mood.',
      psychoeducation: 'Provide helpful information about mental health in an accessible way.'
    };

    return guidelines[intervention as keyof typeof guidelines] || guidelines.validation;
  }

  private calculateEmpathyLevel(analysis: any): number {
    const emotionIntensity = analysis.emotionalAnalysis.emotionIntensity || 0.5;
    const riskLevel = analysis.riskAnalysis.level;

    let empathyLevel = 0.7; // baseline

    if (emotionIntensity > 0.7) empathyLevel += 0.2;
    if (riskLevel !== 'none') empathyLevel += 0.1;

    return Math.min(1, empathyLevel);
  }

  private getValidationStrategies(analysis: any): string[] {
    const strategies = ['acknowledge_feelings', 'normalize_experience'];

    if (analysis.culturalAnalysis.culturalThemes.includes('familyReferences')) {
      strategies.push('validate_family_dynamics');
    }
    if (analysis.culturalAnalysis.culturalThemes.includes('academicPressure')) {
      strategies.push('validate_academic_stress');
    }

    return strategies;
  }

  private getCopingStrategies(analysis: any): string[] {
    const strategies = ['deep_breathing'];

    const primaryEmotion = analysis.emotionalAnalysis.primaryEmotion;

    if (primaryEmotion === 'anxiety') {
      strategies.push('grounding_techniques', 'progressive_relaxation');
    } else if (primaryEmotion === 'depression') {
      strategies.push('behavioral_activation', 'social_connection');
    } else if (primaryEmotion === 'stress') {
      strategies.push('time_management', 'prioritization');
    }

    return strategies;
  }

  private getImmediateActions(riskAnalysis: any): string[] {
    const actions: string[] = [];

    if (riskAnalysis.level === 'severe') {
      actions.push('contact_emergency_services', 'ensure_safety', 'contact_trusted_person');
    } else if (riskAnalysis.level === 'high') {
      actions.push('schedule_professional_help', 'activate_support_network');
    } else if (riskAnalysis.level === 'moderate') {
      actions.push('practice_coping_strategies', 'reach_out_to_support');
    }

    return actions;
  }

  private getFollowUpTimeframe(riskLevel: string): string {
    const timeframes = {
      severe: 'immediate',
      high: 'within 24 hours',
      moderate: 'within 2-3 days',
      low: 'within a week',
      none: 'as needed'
    };

    return timeframes[riskLevel as keyof typeof timeframes] || 'as needed';
  }

  private getSelfHelpResources(analysis: any): string[] {
    const resources = ['mindfulness_apps', 'breathing_exercises'];

    if (analysis.culturalAnalysis.languagePreference !== 'english') {
      resources.push('hindi_meditation_resources');
    }

    return resources;
  }

  private getProfessionalResources(culturalContext: any): string[] {
    const resources = ['local_therapists', 'online_counseling'];

    if (culturalContext.culturalThemes.includes('familyReferences')) {
      resources.push('family_therapy_specialists');
    }

    return resources;
  }

  private getEmergencyResources(): string[] {
    return [
      'National Suicide Prevention Helpline: 9152987821',
      'Vandrevala Foundation: 9999666555',
      'iCall: 9152987821'
    ];
  }

  private getFallbackMessage(analysis: any): string {
    // Only use emotion-specific responses if we have detected an emotion from user input
    if (analysis && analysis.emotionalAnalysis && analysis.emotionalAnalysis.primaryEmotion) {
      const emotion = analysis.emotionalAnalysis.primaryEmotion;
      
      const fallbackMessages = {
        anxiety: "I understand you're feeling anxious. Take a deep breath with me. You're not alone in this.",
        depression: "I hear that you're going through a difficult time. Your feelings are valid, and there is hope.",
        stress: "It sounds like you're under a lot of pressure. Let's work together to find some relief.",
        default: "Thank you for sharing with me. I'm here to support you through whatever you're experiencing."
      };
      
      return fallbackMessages[emotion as keyof typeof fallbackMessages] || fallbackMessages.default;
    }
    
    // Default response when no emotion has been detected yet
    return "I'm here to listen and support you. How are you feeling today?";
  }

  private generateFallbackResponse(_message: string, _userId: string): TherapeuticResponse {
    return {
      message: "I'm here to support you. Would you like to share more about what's on your mind?",
      interventionType: 'validation',
      culturalAdaptation: {
        language: 'mixed',
        culturalReferences: [],
        respectLevel: 'casual'
      },
      emotionalSupport: {
        empathyLevel: 0.8,
        validationStrategies: ['acknowledge_feelings'],
        copingStrategies: ['deep_breathing']
      },
      riskAssessment: {
        level: 'none',
        indicators: [],
        immediateActions: []
      },
      followUp: {
        recommended: false,
        timeframe: 'as needed',
        focus: []
      },
      resources: {
        selfHelp: ['breathing_exercises'],
        professional: ['online_counseling'],
        emergency: this.getEmergencyResources()
      }
    };
  }

  private initializeInterventionStrategies(): void {
    // Initialize intervention strategy mappings
    this.interventionStrategies.set('validation', {
      description: 'Acknowledge and validate emotions',
      techniques: ['reflective_listening', 'emotional_validation', 'normalization']
    });

    this.interventionStrategies.set('cognitive_restructuring', {
      description: 'Help identify and reframe negative thoughts',
      techniques: ['thought_challenging', 'perspective_taking', 'evidence_examination']
    });

    // Add more strategies as needed
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    if (!this.userProfiles.has(userId)) {
      // Create default user context
      const defaultContext: UserContext = {
        userId,
        demographics: {},
        mentalHealthHistory: {
          previousSessions: 0,
          primaryConcerns: [],
          therapeuticGoals: [],
          riskFactors: [],
          protectiveFactors: []
        },
        currentState: {}
      };
      this.userProfiles.set(userId, defaultContext);
    }

    return this.userProfiles.get(userId)!;
  }

  private async getConversationContext(sessionId: string, _userId: string): Promise<ConversationContext> {
    if (!this.activeContexts.has(sessionId)) {
      const defaultContext: ConversationContext = {
        sessionId,
        conversationHistory: [],
        therapeuticPhase: 'rapport_building',
        culturalContext: {
          languagePreference: 'mixed',
          culturalSensitivities: [],
          communicationStyle: 'casual'
        }
      };
      this.activeContexts.set(sessionId, defaultContext);
    }

    return this.activeContexts.get(sessionId)!;
  }

  private updateConversationContext(
    context: ConversationContext,
    userMessage: string,
    response: TherapeuticResponse,
    analysis: any
  ): void {
    // Add to conversation history
    context.conversationHistory.push(
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        emotionalAnalysis: analysis.emotionalAnalysis
      },
      {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }
    );

    // Keep history manageable and prevent repetition
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }

    // Update cultural context
    context.culturalContext.languagePreference = response.culturalAdaptation.language;
  }

  // Public utility methods
  async analyzeConversationTrends(sessionId: string): Promise<any> {
    const context = this.activeContexts.get(sessionId);
    if (!context) return null;

    const emotions = context.conversationHistory
      .filter(entry => entry.emotionalAnalysis)
      .map(entry => entry.emotionalAnalysis);

    return {
      emotionalTrend: this.calculateEmotionalTrend(emotions),
      engagementLevel: this.calculateEngagementLevel(context),
      therapeuticProgress: this.assessTherapeuticProgress(context)
    };
  }

  private calculateEmotionalTrend(emotions: any[]): string {
    if (emotions.length < 2) return 'stable';

    const recent = emotions.slice(-3);
    const earlier = emotions.slice(0, -3);

    const recentAvg = recent.reduce((sum, e) => sum + (e.valence || 0), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, e) => sum + (e.valence || 0), 0) / earlier.length;

    if (recentAvg > earlierAvg + 0.2) return 'improving';
    if (recentAvg < earlierAvg - 0.2) return 'declining';
    return 'stable';
  }

  private calculateEngagementLevel(context: ConversationContext): number {
    const messageCount = context.conversationHistory.length;
    const avgMessageLength = context.conversationHistory
      .filter(entry => entry.role === 'user')
      .reduce((sum, entry) => sum + entry.content.length, 0) / messageCount;

    return Math.min(1, (messageCount * 0.1) + (avgMessageLength / 100));
  }

  private assessTherapeuticProgress(context: ConversationContext): any {
    return {
      rapportBuilding: context.conversationHistory.length > 3 ? 0.8 : 0.4,
      selfAwareness: 0.6, // Would be calculated based on user insights
      copingSkillsUsage: 0.5, // Would track mentioned coping strategies
      emotionalRegulation: 0.6 // Would track emotional stability over time
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();