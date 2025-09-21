import { GoogleGenerativeAI } from '@google/generative-ai';
import { personalizedTherapy } from './responseManager';

// Initialize Gemini AI with proper error handling
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY as string;

console.log('🔑 Gemini API Key Status:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

const isDemoKey = !API_KEY || API_KEY === 'demo-key-for-development' || API_KEY.startsWith('demo-');

if (isDemoKey) {
  console.warn('⚠️ No valid Gemini API key found. Please add VITE_GEMINI_API_KEY to your .env file');
  console.warn('📝 Get your FREE API key from: https://makersuite.google.com/app/apikey');
}

// Initialize Gemini AI using the new API
const genAI = new GoogleGenerativeAI(API_KEY || 'dummy-key');

export interface ConversationContext {
  userMood: string;
  preferredLanguage: 'english' | 'hindi' | 'mixed';
  culturalBackground: string;
  previousMessages: string[];
  userPreferences: {
    interests: string[];
    comfortEnvironment: string;
    avatarStyle: string;
  };
  crisisLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
}

export interface AIResponse {
  message: string;
  suggestedActions: string[];
  moodAssessment: string;
  followUpQuestions: string[];
}

export class GeminiMentalHealthAI {
  constructor() {
    // No need for model initialization with new API
  }

  async generateEmpathicResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      console.log('🤖 Gemini AI Service Debug:', {
        apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND',
        isDemoKey,
        userMessage: userMessage.substring(0, 50) + '...',
        context: context.preferredLanguage
      });

      // Check if we have a valid API key
      if (isDemoKey) {
        console.log('🎭 Using demo response');
        return this.getDemoResponse(userMessage, context);
      }

      console.log('🚀 Using real Gemini API');
      // Build simple prompt without complex personalization that causes repetition
      const prompt = this.buildContextualPrompt(userMessage, context) + '\n\nIMPORTANT: Be direct and specific. NO repetitive phrases.';

      // Use the new Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      console.log('✅ Gemini API response received:', responseText.substring(0, 100) + '...');
      // Parse the AI response
      return this.parseAIResponse(responseText, context);
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildContextualPrompt(userMessage: string, context: ConversationContext): string {
    const languageInstruction = this.getLanguageInstruction(context.preferredLanguage);

    return `
You are MannMitra, an advanced AI mental health companion designed for Indian youth. You provide comprehensive, empathetic, and culturally sensitive mental health support.

CORE PRINCIPLES:
1. COMPREHENSIVE SUPPORT: Provide detailed, helpful responses that address the user's concerns thoroughly
2. CULTURAL SENSITIVITY: Understand Indian family dynamics, academic pressure, and social expectations
3. EVIDENCE-BASED THERAPY: Use proven therapeutic approaches (CBT, DBT, mindfulness)
4. PRACTICAL SOLUTIONS: Offer immediately actionable coping strategies
5. PROFESSIONAL EXPERTISE: Demonstrate deep understanding of mental health principles
6. EMPATHETIC CONNECTION: Show genuine care and understanding

RESPONSE REQUIREMENTS:
- Provide concise but comprehensive responses (80-150 words for main message)
- Address the user's specific concerns with depth and insight
- Offer 2-3 practical coping strategies (not too many)
- Include key therapeutic insights and explanations
- Show understanding of their emotional state
- Provide hope and encouragement
- Use professional but warm language
- DO NOT include repetitive greetings or phrases
- DO NOT repeat content from previous responses
- Be direct and specific to their current message
- Keep responses focused and to the point

LANGUAGE GUIDELINES:
${languageInstruction}

CRISIS PROTOCOL:
${context.crisisLevel !== 'none' ? `
🚨 CRISIS LEVEL: ${context.crisisLevel}
- Prioritize safety and immediate support
- Provide Indian crisis helplines: Vandrevala Foundation (9999 666 555), AASRA (91-22-27546669)
- Use gentle de-escalation techniques
- Encourage professional help while reducing stigma
- Follow up with safety planning
` : ''}

USER MESSAGE: "${userMessage}"

THERAPEUTIC APPROACH:
1. ACKNOWLEDGE: Validate their feelings and experiences
2. UNDERSTAND: Show deep understanding of their situation
3. EXPLORE: Help them understand their emotions and thoughts
4. GUIDE: Provide specific, actionable coping strategies
5. SUPPORT: Offer ongoing encouragement and hope
6. EMPOWER: Help them build resilience and self-awareness

RESPONSE FORMAT (JSON):
{
  "message": "Your concise but comprehensive therapeutic response (80-150 words) that addresses their concerns with depth, provides practical guidance, and shows genuine understanding. Use markdown formatting for better structure:\n- Use **bold** for important points\n- Use bullet points (-) for lists\n- Use numbered lists (1., 2., 3.) for steps\n- Use *italics* for emphasis\n- NO repetitive greetings or previous response content\n- Keep it focused and to the point",
  "suggestedActions": [
    "Immediate coping strategy with specific steps",
    "Short-term action plan with clear instructions",
    "Long-term wellness practice with benefits explained"
  ],
  "moodAssessment": "Detailed professional assessment of their emotional state, underlying needs, and recommended therapeutic approach",
  "followUpQuestions": [
    "Thoughtful question to deepen understanding of their situation",
    "Therapeutic question to encourage self-reflection and growth"
  ]
}

Remember: You are a trusted mental health professional who combines clinical expertise with cultural understanding to provide meaningful support to young people in India. Focus on their current message only.
`;
  }

  private getLanguageInstruction(language: string): string {
    switch (language) {
      case 'hindi':
        return `
LANGUAGE: Respond primarily in Hindi (Devanagari script)
- Use warm, respectful Hindi: "आप", "जी हाँ", "बिल्कुल"
- Include comforting phrases: "सब ठीक हो जाएगा", "आप अकेले नहीं हैं", "मैं समझ सकता हूँ"
- Use therapeutic Hindi terms: "मानसिक स्वास्थ्य", "भावनाएं", "तनाव"
- Cultural expressions: "धैर्य रखिए", "हिम्मत मत हारिए"
- Provide detailed, comprehensive responses in Hindi`;

      case 'mixed':
        return `
LANGUAGE: Professional English with appropriate cultural sensitivity
- Use clear, comprehensive English
- Provide detailed, helpful responses
- Include cultural understanding when relevant
- Use professional therapeutic language
- Avoid repetitive phrases
- Be specific and insightful`;

      default:
        return `
LANGUAGE: Professional English with appropriate cultural sensitivity
- Use clear, comprehensive English
- Provide detailed, helpful responses
- Include cultural understanding when relevant
- Use professional therapeutic language
- Avoid repetitive phrases
- Be specific and insightful`;
    }
  }

  private parseAIResponse(responseText: string, context: ConversationContext): AIResponse {
    try {
      // Clean the response text
      let cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();

      // If response doesn't start with {, try to find JSON within the text
      if (!cleanedResponse.startsWith('{')) {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }
      }

      const parsed = JSON.parse(cleanedResponse);

      // Validate and structure the response
      const message = parsed.message || this.extractMessageFromText(responseText, context);
      return {
        message: personalizedTherapy.processResponse(message), // Process through personalized therapy manager
        suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : this.getDefaultActions(context),
        moodAssessment: parsed.moodAssessment || 'User needs supportive conversation',
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : this.getDefaultQuestions(context)
      };
    } catch (error) {
      // Fallback to plain text response
      return {
        message: personalizedTherapy.processResponse(responseText), // Process through personalized therapy manager
        suggestedActions: this.generateFallbackActions(context),
        moodAssessment: context.userMood,
        followUpQuestions: this.generateFallbackQuestions(context)
      };
    }
  }

  private getFallbackResponse(_userMessage: string, _context: ConversationContext): AIResponse {
    const fallbackMessages = {
      english: "I'm here to listen and support you. Your feelings are valid, and you're not alone in this journey.",
      hindi: "मैं यहाँ आपको सुनने और सहारा देने के लिए हूँ। आपकी भावनाएं सही हैं, और इस सफर में आप अकेले नहीं हैं।",
      mixed: "मैं यहाँ हूँ आपके साथ। Your feelings are valid और आप alone नहीं हैं इस journey में।"
    };

    return {
      message: fallbackMessages[_context.preferredLanguage],
      suggestedActions: this.generateFallbackActions(_context),
      moodAssessment: 'supportive_needed',
      followUpQuestions: this.generateFallbackQuestions(_context)
    };
  }

  private extractMessageFromText(text: string, _context: ConversationContext): string {
    // Extract meaningful message from unstructured text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  private getDefaultActions(context: ConversationContext): string[] {
    return this.generateFallbackActions(context);
  }

  private getDefaultQuestions(context: ConversationContext): string[] {
    return this.generateFallbackQuestions(context);
  }

  private generateFallbackActions(context: ConversationContext): string[] {
    const actions = {
      english: [
        'Take 5 deep breaths slowly',
        'Try a 2-minute mindfulness exercise',
        'Reach out to someone you trust'
      ],
      hindi: [
        '5 गहरी सांसें धीरे-धीरे लें',
        '2 मिनट का mindfulness exercise करें',
        'किसी भरोसेमंद व्यक्ति से बात करें'
      ],
      mixed: [
        'Take 5 deep सांसें slowly',
        'Try करें 2-minute mindfulness',
        'किसी trusted person से बात करें'
      ]
    };

    return actions[context.preferredLanguage] || actions.english;
  }

  private generateFallbackQuestions(context: ConversationContext): string[] {
    const questions = {
      english: [
        'How are you feeling right now?',
        'What would help you feel better today?'
      ],
      hindi: [
        'अभी आप कैसा महसूस कर रहे हैं?',
        'आज आपको क्या बेहतर महसूस करने में मदद करेगा?'
      ],
      mixed: [
        'अभी आप कैसा feel कर रहे हैं?',
        'आज क्या help करेगा आपको better feel करने में?'
      ]
    };

    return questions[context.preferredLanguage] || questions.english;
  }
  // Generic generateResponse method for compatibility
  async generateResponse(prompt: string, _options: any = {}): Promise<string> {
    try {
      // Check if we have a valid API key
      if (isDemoKey) {
        return this.getSimpleDemoResponse(prompt);
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return this.getSimpleDemoResponse(prompt);
    }
  }

  private getSimpleDemoResponse(prompt: string): string {
    // Simple demo responses for development
    if (prompt.toLowerCase().includes('crisis') || prompt.toLowerCase().includes('emergency')) {
      return "I understand you're going through a difficult time. Please remember that help is available. If you're in immediate danger, please contact emergency services or a crisis helpline.";
    }

    if (prompt.toLowerCase().includes('sad') || prompt.toLowerCase().includes('depressed')) {
      return "I hear that you're feeling sad. These feelings are valid, and it's okay to not be okay sometimes. Would you like to talk about what's been troubling you?";
    }

    if (prompt.toLowerCase().includes('anxious') || prompt.toLowerCase().includes('worried')) {
      return "Anxiety can be overwhelming. Let's take this one step at a time. Have you tried any breathing exercises or grounding techniques?";
    }

    return "I'm here to listen and support you. Your mental health matters, and you're taking a positive step by reaching out.";
  }

  private getDemoResponse(userMessage: string, context: ConversationContext): AIResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Crisis responses
    if (lowerMessage.includes('crisis') || lowerMessage.includes('emergency') ||
      lowerMessage.includes('suicide') || lowerMessage.includes('kill myself')) {
      return {
        message: context.preferredLanguage === 'hindi'
          ? "मुझे आपकी बहुत चिंता है। कृपया तुरंत किसी professional से बात करें। आपका जीवन मूल्यवान है।"
          : "I'm very concerned about you. Please talk to a professional immediately. Your life is valuable.",
        suggestedActions: context.preferredLanguage === 'hindi'
          ? ['तुरंत crisis helpline को call करें', 'किसी trusted person से बात करें']
          : ['Call crisis helpline immediately', 'Talk to someone you trust'],
        moodAssessment: 'crisis_intervention_needed',
        followUpQuestions: context.preferredLanguage === 'hindi'
          ? ['क्या आप safe हैं right now?']
          : ['Are you safe right now?']
      };
    }

    // Sadness responses - only if user explicitly mentions feeling sad
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') ||
      lowerMessage.includes('उदास') || lowerMessage.includes('दुखी')) {
      return {
        message: context.preferredLanguage === 'hindi'
          ? "मैं समझ सकता हूं कि आप दुखी हैं। ये भावनाएं सही हैं। आप अकेले नहीं हैं।"
          : "I understand you're feeling sad. These feelings are valid, and you're not alone.",
        suggestedActions: context.preferredLanguage === 'hindi'
          ? ['गहरी सांसें लें', 'किसी भरोसेमंद से बात करें', 'कुछ gentle music सुनें']
          : ['Take deep breaths', 'Talk to someone you trust', 'Listen to gentle music'],
        moodAssessment: 'supportive_needed',
        followUpQuestions: context.preferredLanguage === 'hindi'
          ? ['क्या आप बता सकते हैं कि क्या परेशान कर रहा है?']
          : ['Can you tell me what\'s troubling you?']
      };
    }

    // Anxiety responses
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') ||
      lowerMessage.includes('चिंता') || lowerMessage.includes('घबराहट')) {
      return {
        message: context.preferredLanguage === 'hindi'
          ? "चिंता overwhelming हो सकती है। आइए step by step इसे handle करते हैं।"
          : "Anxiety can be overwhelming. Let's take this one step at a time.",
        suggestedActions: context.preferredLanguage === 'hindi'
          ? ['5-4-3-2-1 grounding technique try करें', 'गहरी सांसें लें', 'present moment पर focus करें']
          : ['Try 5-4-3-2-1 grounding technique', 'Take deep breaths', 'Focus on the present moment'],
        moodAssessment: 'anxiety_management_needed',
        followUpQuestions: context.preferredLanguage === 'hindi'
          ? ['आपको क्या चिंता कर रहा है?']
          : ['What is worrying you?']
      };
    }

    // Default supportive response
    return {
      message: context.preferredLanguage === 'hindi'
        ? "मैं यहाँ आपको सुनने और सहारा देने के लिए हूँ। आपकी mental health important है।"
        : "I'm here to listen and support you. Your mental health matters, and you're taking a positive step by reaching out.",
      suggestedActions: context.preferredLanguage === 'hindi'
        ? ['अपनी feelings को express करें', 'कुछ self-care करें', 'किसी से बात करें']
        : ['Express your feelings', 'Practice self-care', 'Talk to someone'],
      moodAssessment: 'supportive_conversation',
      followUpQuestions: context.preferredLanguage === 'hindi'
        ? ['आज आप कैसा feel कर रहे हैं?']
        : ['How are you feeling today?']
    };
  }
}

// Export singleton instance
export const geminiAI = new GeminiMentalHealthAI();