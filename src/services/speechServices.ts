// Enhanced Speech Services with Multiple Voice Options
// Provides text-to-speech with various voice personalities and languages

// Web Speech API type declarations
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  accent: string;
  personality: 'calm' | 'energetic' | 'supportive' | 'professional' | 'friendly';
  description: string;
  voiceURI?: string;
  pitch: number;
  rate: number;
  volume: number;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'sarah-supportive',
    name: 'Sarah',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    personality: 'supportive',
    description: 'Warm, caring therapist voice',
    pitch: 1.0,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'alex-calm',
    name: 'Alex',
    gender: 'male',
    language: 'en-US',
    accent: 'American',
    personality: 'calm',
    description: 'Soothing, meditative guide',
    pitch: 0.8,
    rate: 0.8,
    volume: 0.7
  },
  {
    id: 'maya-energetic',
    name: 'Maya',
    gender: 'female',
    language: 'en-IN',
    accent: 'Indian',
    personality: 'energetic',
    description: 'Motivational coach voice',
    pitch: 1.2,
    rate: 1.1,
    volume: 0.9
  },
  {
    id: 'raj-friendly',
    name: 'Raj',
    gender: 'male',
    language: 'en-IN',
    accent: 'Indian',
    personality: 'friendly',
    description: 'Encouraging friend voice',
    pitch: 1.0,
    rate: 1.0,
    volume: 0.8
  },
  {
    id: 'priya-professional',
    name: 'Dr. Priya',
    gender: 'female',
    language: 'en-IN',
    accent: 'Indian',
    personality: 'professional',
    description: 'Professional therapist voice',
    pitch: 0.9,
    rate: 0.9,
    volume: 0.8
  },
  {
    id: 'david-confident',
    name: 'David',
    gender: 'male',
    language: 'en-US',
    accent: 'American',
    personality: 'energetic',
    description: 'Confident motivator voice',
    pitch: 0.9,
    rate: 1.0,
    volume: 0.9
  }
];

export interface VoiceAnalysis {
  transcript: string;
  confidence: number;
  detectedLanguage: string;
  emotionalTone: 'calm' | 'stressed' | 'sad' | 'anxious' | 'happy' | 'neutral';
  speechRate: 'slow' | 'normal' | 'fast';
}

export interface SpeechConfig {
  language: 'hi-IN' | 'en-IN' | 'en-US' | 'auto';
  continuous: boolean;
  interimResults: boolean;
  selectedVoice?: VoiceOption;
}

export class SpeechService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private currentVoice: VoiceOption = AVAILABLE_VOICES[0]!;

  constructor() {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    this.synthesis = window.speechSynthesis;
    this.setupRecognition();
  }

  setVoice(voice: VoiceOption): void {
    this.currentVoice = voice;
  }

  getCurrentVoice(): VoiceOption {
    return this.currentVoice;
  }

  getAvailableVoiceOptions(): VoiceOption[] {
    return AVAILABLE_VOICES;
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US'; // Default to English (US)
  }

  async startListening(
    config: SpeechConfig = { language: 'auto', continuous: true, interimResults: true },
    onResult: (analysis: VoiceAnalysis) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.lang = config.language === 'auto' ? 'en-US' : config.language;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;

          // Analyze the final transcript
          const analysis = this.analyzeVoice(transcript, confidence);
          onResult(analysis);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      onError(`Failed to start speech recognition: ${error}`);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private analyzeVoice(transcript: string, confidence: number): VoiceAnalysis {
    // Detect language
    const detectedLanguage = this.detectLanguage(transcript);

    // Analyze emotional tone based on keywords and patterns
    const emotionalTone = this.analyzeEmotionalTone(transcript);

    // Estimate speech rate (simplified)
    const speechRate = this.estimateSpeechRate(transcript);

    return {
      transcript,
      confidence: confidence || 0.8,
      detectedLanguage,
      emotionalTone,
      speechRate
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on script
    const hindiPattern = /[\u0900-\u097F]/;
    const englishPattern = /[a-zA-Z]/;

    const hasHindi = hindiPattern.test(text);
    const hasEnglish = englishPattern.test(text);

    if (hasHindi && hasEnglish) return 'mixed';
    if (hasHindi) return 'hindi';
    return 'english';
  }

  private analyzeEmotionalTone(text: string): VoiceAnalysis['emotionalTone'] {
    const lowerText = text.toLowerCase();

    // Stress indicators
    const stressKeywords = ['stressed', 'tension', 'pressure', 'तनाव', 'परेशान', 'चिंता'];
    if (stressKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'stressed';
    }

    // Sadness indicators
    const sadKeywords = ['sad', 'depressed', 'down', 'उदास', 'दुखी', 'निराश'];
    if (sadKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'sad';
    }

    // Anxiety indicators
    const anxietyKeywords = ['anxious', 'worried', 'nervous', 'चिंतित', 'घबराहट', 'डर'];
    if (anxietyKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'anxious';
    }

    // Happiness indicators
    const happyKeywords = ['happy', 'good', 'great', 'खुश', 'अच्छा', 'बेहतर'];
    if (happyKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'happy';
    }

    return 'neutral';
  }

  private estimateSpeechRate(text: string): VoiceAnalysis['speechRate'] {
    // Simplified speech rate estimation based on text length
    // In a real implementation, this would use timing data
    const wordCount = text.split(' ').length;

    if (wordCount < 5) return 'slow';
    if (wordCount > 15) return 'fast';
    return 'normal';
  }

  async speakText(
    text: string,
    voiceOption?: VoiceOption,
    customRate?: number,
    customPitch?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const voice = voiceOption || this.currentVoice;
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = voice.language;
      utterance.rate = customRate || voice.rate;
      utterance.pitch = customPitch || voice.pitch;
      utterance.volume = voice.volume;

      // Try to find the best matching system voice
      const systemVoices = this.synthesis.getVoices();
      let selectedVoice = null;

      // First try to match by gender and language
      const langPrefix = voice.language?.split('-')[0] || 'en';
      selectedVoice = systemVoices.find(v => 
        v.lang.startsWith(langPrefix) && 
        (voice.gender === 'female' ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') : 
         voice.gender === 'male' ? v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') : true)
      );

      // Fallback to any voice matching the language
      if (!selectedVoice) {
        selectedVoice = systemVoices.find(v => v.lang.startsWith(langPrefix));
      }

      // Final fallback to default voice
      if (!selectedVoice && systemVoices.length > 0) {
        selectedVoice = systemVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to load
        this.synthesis.onvoiceschanged = () => {
          resolve(this.synthesis.getVoices());
        };
      }
    });
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  isListeningActive(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
export const speechService = new SpeechService();

// Voice-enabled AI companion responses
export class VoiceEnabledAI {
  private speechService: SpeechService;

  constructor() {
    this.speechService = new SpeechService();
  }

  async startVoiceConversation(
    onTranscript: (analysis: VoiceAnalysis) => void,
    onError: (error: string) => void,
    language: 'hi-IN' | 'en-IN' | 'auto' = 'auto'
  ): Promise<void> {
    await this.speechService.startListening(
      { language, continuous: true, interimResults: true },
      onTranscript,
      onError
    );
  }

  stopVoiceConversation(): void {
    this.speechService.stopListening();
  }

  async respondWithVoice(
    text: string,
    _language: 'hi-IN' | 'en-IN' = 'en-IN',
    emotionalTone: 'calm' | 'supportive' | 'energetic' | 'professional' | 'friendly' = 'calm',
    voiceOption?: VoiceOption
  ): Promise<void> {
    // Find voice that matches the emotional tone if no specific voice provided
    let selectedVoice = voiceOption;
    
    if (!selectedVoice) {
      selectedVoice = AVAILABLE_VOICES.find(v => v.personality === emotionalTone) || AVAILABLE_VOICES[0]!;
    }

    await this.speechService.speakText(text, selectedVoice);
  }

  setVoice(voice: VoiceOption): void {
    this.speechService.setVoice(voice);
  }

  getCurrentVoice(): VoiceOption {
    return this.speechService.getCurrentVoice();
  }

  getAvailableVoices(): VoiceOption[] {
    return this.speechService.getAvailableVoiceOptions();
  }

  isVoiceSupported(): boolean {
    return this.speechService.isSupported();
  }

  stopVoice(): void {
    this.speechService.synthesis.cancel();
  }
}

export const voiceAI = new VoiceEnabledAI();