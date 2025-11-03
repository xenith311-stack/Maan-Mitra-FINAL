import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  orderBy, // Keep orderBy for existing methods
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  onboardingComplete: boolean;
  preferences: {
    language: 'hindi' | 'english' | 'mixed';
    culturalBackground: string;
    communicationStyle: 'formal' | 'casual';
    interests: string[];
    comfortEnvironment: string;
    avatarStyle: string;
    notificationsEnabled: boolean;
    crisisContactName?: string;
    crisisContactPhone?: string;
  };
  mentalHealthProfile: {
    primaryConcerns: string[];
    goals: string[];
    riskFactors: string[];
    protectiveFactors: string[];
    currentRiskLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    lastAssessmentDate?: Date;
    phq9Score?: number;
    gad7Score?: number;
    wellnessScore?: number;
  };
  therapeuticPlan: {
    primaryGoals: string[];
    secondaryGoals: string[];
    interventionStrategies: string[];
    progressMilestones: { [milestone: string]: boolean };
    lastUpdated: Date;
  };
  privacySettings: {
    dataCollection: boolean;
    analyticsOptIn: boolean;
    researchParticipation: boolean;
  };
}

// Session Data Interface
export interface SessionData {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  sessionType: 'chat' | 'voice' | 'video' | 'assessment' | 'crisis';
  progressMetrics: {
    emotionalRegulation: number;
    selfAwareness: number;
    copingSkillsUsage: number;
    therapeuticAlliance: number;
    engagementLevel: number;
  };
  outcomes: {
    overallMood: 'improved' | 'stable' | 'declined';
    goalsAddressed: string[];
    skillsPracticed: string[];
    insightsGained: string[];
  };
  updatedAt?: Date;
}

// Define Interfaces for Subcollection Documents
export interface SessionInteraction {
  timestamp: Date;
  type: 'user_message' | 'ai_response' | 'emotion_detected' | 'voice_analysis';
  content: string;
  metadata?: any;
}

export interface SessionEmotion {
  timestamp: Date;
  primaryEmotion: string;
  intensity: number;
  valence: number;
  arousal: number;
  confidence: number;
  source: 'text' | 'voice' | 'facial';
}

export interface SessionRiskAssessment {
  timestamp: Date;
  level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  indicators: string[];
  interventions: string[];
  // Removed fields not relevant to a single point-in-time assessment
}

// Crisis Event Interface
export interface CrisisEvent {
  eventId: string;
  userId: string;
  timestamp: Date;
  severity: 'moderate' | 'high' | 'severe';
  triggerMessage: string;
  detectedIndicators: string[];
  interventionsTaken: string[];
  helplinesCalled?: string[];
  professionalReferral: boolean;
  followUpScheduled: boolean;
  resolution: 'resolved' | 'monitoring' | 'escalated' | 'pending';
  notes?: string;
}

// Assessment Result Interface
export interface AssessmentResult {
  assessmentId: string;
  userId: string;
  assessmentType: 'phq9' | 'gad7' | 'custom_wellness' | 'crisis_screening';
  completedAt: Date;
  responses: { [questionId: string]: number | string };
  scores: {
    totalScore: number;
    subscaleScores?: { [subscale: string]: number };
    severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
    recommendations: string[];
  };
  comparedToPrevious?: {
    previousScore: number;
    change: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

// Journal Entry Interface
export interface JournalEntry {
  entryId: string;
  userId: string;
  title: string;
  content: string;
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
  emotions: string[];
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  aiInsights?: {
    sentimentScore?: number; // e.g., -1.0 (negative) to 1.0 (positive)
    sentimentMagnitude?: number; // Strength of sentiment
    keyThemes?: string[]; // e.g., ['work', 'stress', 'family']
    positiveMentions?: string[]; // Specific positive phrases/topics
    negativeMentions?: string[]; // Specific negative phrases/topics
    potentialTriggers?: string[]; // Possible triggers identified
    copingMentioned?: string[]; // Coping mechanisms mentioned
    riskFlags?: string[]; // e.g., ['hopelessness', 'self_harm_reference'] - Use cautiously!
    summary?: string; // Brief AI-generated summary
    analysisTimestamp?: Date; // When was this analyzed
    modelVersion?: string; // Which AI model version was used
  };
}

// Mood Entry Interface
export interface MoodEntry {
  entryId: string;
  userId: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  sleep: number; // 1-10 scale
  notes?: string;
  triggers?: string[];
  activities?: string[];
  location?: string;
  weather?: string;
  createdAt: Date;
}

// Chat Conversation Interface
export interface ChatConversation {
  conversationId: string;
  userId: string;
  title: string;
  // messages: ChatMessage[];
  startedAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
  sessionType: 'general' | 'crisis' | 'therapy' | 'assessment';
  aiPersonality: 'supportive' | 'professional' | 'friendly' | 'clinical';
}

// Chat Message Interface
export interface ChatMessage {
  messageId: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  messageType: 'text' | 'voice' | 'image' | 'assessment' | 'crisis_alert';
  metadata?: {
    sentiment?: number;
    detectedLanguage?: string; // Add this
    emotions?: string[];
    riskLevel?: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    aiModel?: string;
    responseTime?: number; // Should be number or Timestamp
  };
}

// --- Define Chart Data Types ---
export interface DateValuePoint {
  date: string; // Formatted date string (e.g., 'Oct 29')
  value: number;
}

export interface AssessmentHistoryPoint {
  date: string; // Formatted date string
  phq9: number | null;
  gad7: number | null;
}
// --- End Chart Data Types ---

// --- Update ProgressData Interface ---
export interface ProgressData {
  timeframe: string;
  sessions: {
    total: number;
    averageDuration: number;
    emotionalTrend: string;
    engagementLevel: number;
  };
  assessments: {
    total: number;
    latestScores: {
      phq9: number | null;
      gad7: number | null;
    };
    progressTrend: {
      phq9: string;
      gad7: string;
    };
  };
  insights: string[];
  // --- Add fields for chart data ---
  emotionalTrendChartData: DateValuePoint[];
  assessmentHistoryChartData: AssessmentHistoryPoint[];
  // --- End added fields ---
}
// --- End Update ProgressData ---

// Legacy Progress Tracking Interface (for daily progress tracking)
export interface DailyProgressData {
  userId: string;
  date: Date;
  metrics: {
    overallWellbeing: number; // 1-10
    moodStability: number; // 1-10
    anxietyLevel: number; // 1-10
    sleepQuality: number; // 1-10
    socialConnection: number; // 1-10
    copingSkills: number; // 1-10
  };
  goals: {
    goalId: string;
    title: string;
    progress: number; // 0-100%
    completed: boolean;
  }[];
  achievements: string[];
  challenges: string[];
}

// App Settings Interface
export interface AppSettings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'english' | 'hindi' | 'mixed';
  notifications: {
    enabled: boolean;
    dailyCheckIn: boolean;
    moodReminders: boolean;
    crisisAlerts: boolean;
    progressUpdates: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    crashReporting: boolean;
    personalizedAds: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
  };
  aiPreferences: {
    personality: 'supportive' | 'professional' | 'friendly';
    responseLength: 'brief' | 'detailed';
    culturalContext: boolean;
    hindiSupport: boolean;
  };
}
function removeUndefinedValues(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    // Filter out undefined values from arrays as well
    return obj.map(removeUndefinedValues).filter(val => val !== undefined);
  }
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = removeUndefinedValues(obj[key]);
      if (value !== undefined) {
        newObj[key] = value;
      }
    }
  }
  // Return null if the object becomes empty after cleaning,
  // or handle as needed depending if an empty metadata object is desired.
  // Returning {} might be safer if the field itself is expected.
  return Object.keys(newObj).length > 0 ? newObj : {}; // Return empty object if all nested were undefined
}

// Firebase Service Class
export class FirebaseService {
  private currentUser: User | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.updateLastLoginTime(user.uid);
      }
    });
  }

  // ==================== AUTHENTICATION ====================

  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        onboardingComplete: false,
        preferences: {
          language: 'mixed',
          culturalBackground: 'indian',
          communicationStyle: 'casual',
          interests: [],
          comfortEnvironment: '',
          avatarStyle: 'friendly',
          notificationsEnabled: true
        },
        mentalHealthProfile: {
          primaryConcerns: [],
          goals: [],
          riskFactors: [],
          protectiveFactors: [],
          currentRiskLevel: 'none'
        },
        therapeuticPlan: {
          primaryGoals: [],
          secondaryGoals: [],
          interventionStrategies: [],
          progressMilestones: {},
          lastUpdated: new Date()
        },
        privacySettings: {
          dataCollection: true,
          analyticsOptIn: true,
          researchParticipation: false
        }
      };

      await this.createUserProfile(userProfile);
      return userProfile;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return userProfile;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      let userProfile = await this.getUserProfile(user.uid);

      if (!userProfile) {
        // Create new profile for Google user
        userProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || "",
          createdAt: new Date(),
          lastLoginAt: new Date(),
          onboardingComplete: false,
          preferences: {
            language: 'mixed',
            culturalBackground: 'indian',
            communicationStyle: 'casual',
            interests: [],
            comfortEnvironment: '',
            avatarStyle: 'friendly',
            notificationsEnabled: true
          },
          mentalHealthProfile: {
            primaryConcerns: [],
            goals: [],
            riskFactors: [],
            protectiveFactors: [],
            currentRiskLevel: 'none'
          },
          therapeuticPlan: {
            primaryGoals: [],
            secondaryGoals: [],
            interventionStrategies: [],
            progressMilestones: {},
            lastUpdated: new Date()
          },
          privacySettings: {
            dataCollection: true,
            analyticsOptIn: true,
            researchParticipation: false
          }
        };

        await this.createUserProfile(userProfile);
      }

      return userProfile;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin, // Redirect back to your app after reset
        handleCodeInApp: false
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ==================== USER PROFILE MANAGEMENT ====================

  // Create user profile
  async createUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userProfile.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        'therapeuticPlan.lastUpdated': serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile: UserProfile = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          therapeuticPlan: {
            ...data.therapeuticPlan,
            lastUpdated: data.therapeuticPlan?.lastUpdated?.toDate() || new Date()
          }
        } as UserProfile;
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(uid: string, onboardingData: any): Promise<void> {
    try {
      const updates: Partial<UserProfile> = {
        onboardingComplete: true,
        preferences: {
          ...onboardingData.preferences,
          language: onboardingData.language || 'mixed',
          culturalBackground: onboardingData.culturalBackground || 'indian',
          communicationStyle: onboardingData.communicationStyle || 'casual',
          interests: onboardingData.interests || [],
          comfortEnvironment: onboardingData.comfortEnvironment || '',
          avatarStyle: onboardingData.avatarStyle || 'friendly',
          notificationsEnabled: true
        },
        mentalHealthProfile: {
          primaryConcerns: onboardingData.concerns || [],
          goals: onboardingData.goals || [],
          riskFactors: onboardingData.riskFactors || [],
          protectiveFactors: onboardingData.protectiveFactors || [],
          currentRiskLevel: 'none'
        }
      };

      await this.updateUserProfile(uid, updates);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Update last login time
  private async updateLastLoginTime(uid: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login time:', error);
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  // Create new session document (without arrays)
  async createSession(sessionData: Omit<SessionData, 'sessionId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        startTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Initialize empty metrics/outcomes if not provided
        progressMetrics: sessionData.progressMetrics || {
          emotionalRegulation: 0,
          selfAwareness: 0,
          copingSkillsUsage: 0,
          therapeuticAlliance: 0,
          engagementLevel: 0
        },
        outcomes: sessionData.outcomes || {
          overallMood: 'stable',
          goalsAddressed: [],
          skillsPracticed: [],
          insightsGained: []
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Add Interaction to Subcollection
  async addInteractionToSubcollection(sessionId: string, interaction: Omit<SessionInteraction, 'timestamp'>): Promise<void> {
    try {
      const interactionColRef = collection(db, 'sessions', sessionId, 'interactions');
      // --- START SANITIZATION ---
      // Deep clean the entire interaction object, especially metadata
      const sanitizedInteraction = removeUndefinedValues(interaction);
      // --- END SANITIZATION ---
      // Ensure we have something valid to add
      if (!sanitizedInteraction || typeof sanitizedInteraction !== 'object' || Object.keys(sanitizedInteraction).length === 0) {
        console.warn(`Skipping addInteraction for session ${sessionId} - sanitized data is empty.`);
        return;
      }
      await addDoc(interactionColRef, {
        ...interaction,
        timestamp: serverTimestamp()
      });
      // Also update the main session doc's updatedAt timestamp
      await this.updateSessionTimestamp(sessionId);
    } catch (error) {
      console.error(`Error adding interaction to session ${sessionId}:`, error);
      throw error;
    }
  }

  // Add Emotion Data Point to Subcollection
  async addEmotionToSubcollection(sessionId: string, emotion: Omit<SessionEmotion, 'timestamp'>): Promise<void> {
    try {
      const emotionColRef = collection(db, 'sessions', sessionId, 'emotionalJourney');
      await addDoc(emotionColRef, {
        ...emotion,
        timestamp: serverTimestamp()
      });
      await this.updateSessionTimestamp(sessionId);
    } catch (error) {
      console.error(`Error adding emotion data to session ${sessionId}:`, error);
      throw error;
    }
  }

  // Add Risk Assessment to Subcollection
  async addRiskAssessmentToSubcollection(sessionId: string, riskAssessment: Omit<SessionRiskAssessment, 'timestamp'>): Promise<void> {
    try {
      const riskColRef = collection(db, 'sessions', sessionId, 'riskAssessments');
      await addDoc(riskColRef, {
        ...riskAssessment,
        timestamp: serverTimestamp()
      });
      await this.updateSessionTimestamp(sessionId);
    } catch (error) {
      console.error(`Error adding risk assessment to session ${sessionId}:`, error);
      throw error;
    }
  }

  // Helper: Update only timestamp
  private async updateSessionTimestamp(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      await updateDoc(docRef, { updatedAt: serverTimestamp() });
    } catch (error) {
      console.warn(`Failed to update session timestamp for ${sessionId}:`, error);
      // Non-critical, just log warning
    }
  }

  // Update session (mainly for metrics, outcomes, or general updates - no longer handles large arrays)
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      const sanitizedUpdates = removeUndefinedValues(updates);

      if (Object.keys(sanitizedUpdates).length === 0) {
        console.log(`Skipping update for session ${sessionId} - no valid data.`);
        // Still update timestamp if only timestamp update is intended
        if (updates && updates.hasOwnProperty('updatedAt')) {
          await updateDoc(docRef, { updatedAt: serverTimestamp() });
        }
        return;
      }

      await updateDoc(docRef, {
        ...sanitizedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  // End session (Calculates final duration, updates outcomes)
  async endSession(sessionId: string, finalData: Partial<Pick<SessionData, 'outcomes'>>): Promise<void> {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(docRef);

      if (!sessionDoc.exists()) {
        throw new Error(`Session ${sessionId} not found.`);
      }

      const startTime = (sessionDoc.data()?.startTime as Timestamp)?.toDate();
      const duration = startTime ? Date.now() - startTime.getTime() : 0;

      await updateDoc(docRef, {
        ...(finalData.outcomes && { outcomes: finalData.outcomes }),
        duration: duration,
        endTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  // Get session interactions from subcollection
  async getSessionInteractions(sessionId: string, limitCount: number = 100): Promise<SessionInteraction[]> {
    try {
      const q = query(
        collection(db, 'sessions', sessionId, 'interactions'),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const interactions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date()
      })) as SessionInteraction[];

      return interactions;
    } catch (error) {
      console.error(`Error getting interactions for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Get session emotional journey from subcollection
  async getSessionEmotionalJourney(sessionId: string, limitCount: number = 100): Promise<SessionEmotion[]> {
    try {
      const q = query(
        collection(db, 'sessions', sessionId, 'emotionalJourney'),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const emotions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date()
      })) as SessionEmotion[];

      return emotions;
    } catch (error) {
      console.error(`Error getting emotional journey for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Get session risk assessments from subcollection
  async getSessionRiskAssessments(sessionId: string, limitCount: number = 100): Promise<SessionRiskAssessment[]> {
    try {
      const q = query(
        collection(db, 'sessions', sessionId, 'riskAssessments'),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const riskAssessments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date()
      })) as SessionRiskAssessment[];

      return riskAssessments;
    } catch (error) {
      console.error(`Error getting risk assessments for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Get user sessions (NO INDEX REQUIRED)
  async getUserSessions(uid: string, limitCount: number = 10): Promise<SessionData[]> {
    try {
      // Simple query without composite index
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', uid),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        sessionId: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || undefined
      })) as SessionData[];

      // Sort in memory by startTime descending
      return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // ==================== CRISIS MANAGEMENT ====================

  // Record crisis event
  async recordCrisisEvent(crisisEvent: Omit<CrisisEvent, 'eventId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'crisisEvents'), {
        ...crisisEvent,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Update user's risk level
      const userProfile = await this.getUserProfile(crisisEvent.userId);
      if (userProfile) {
        await this.updateUserProfile(crisisEvent.userId, {
          mentalHealthProfile: {
            ...userProfile.mentalHealthProfile,
            currentRiskLevel: crisisEvent.severity,
            lastAssessmentDate: new Date()
          }
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error recording crisis event:', error);
      throw error;
    }
  }

  // Get user crisis events (NO INDEX REQUIRED)
  async getUserCrisisEvents(uid: string): Promise<CrisisEvent[]> {
    try {
      // Simple query without composite index
      const q = query(
        collection(db, 'crisisEvents'),
        where('userId', '==', uid),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({
        eventId: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as CrisisEvent[];

      // Sort in memory by timestamp descending
      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting crisis events:', error);
      throw error;
    }
  }

  // ==================== ASSESSMENTS ====================

  // Save assessment result
  async saveAssessmentResult(assessment: Omit<AssessmentResult, 'assessmentId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'assessments'), {
        ...assessment,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Update user's mental health profile with latest scores
      const updates: any = {};
      if (assessment.assessmentType === 'phq9') {
        updates['mentalHealthProfile.phq9Score'] = assessment.scores.totalScore;
      } else if (assessment.assessmentType === 'gad7') {
        updates['mentalHealthProfile.gad7Score'] = assessment.scores.totalScore;
      }
      updates['mentalHealthProfile.lastAssessmentDate'] = new Date();

      await this.updateUserProfile(assessment.userId, updates);

      return docRef.id;
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }
  }

  // Get user assessments (NO INDEX REQUIRED)
  async getUserAssessments(uid: string, assessmentType?: string): Promise<AssessmentResult[]> {
    try {
      // Simple query without composite index
      let q = query(
        collection(db, 'assessments'),
        where('userId', '==', uid)
      );

      if (assessmentType) {
        q = query(q, where('assessmentType', '==', assessmentType));
      }

      const querySnapshot = await getDocs(q);
      const assessments = querySnapshot.docs.map(doc => ({
        assessmentId: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      })) as AssessmentResult[];

      // Sort in memory by completedAt descending
      return assessments.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } catch (error) {
      console.error('Error getting assessments:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & INSIGHTS (Modified) ====================

  // Get user progress analytics including chart data
  async getUserProgressAnalytics(uid: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<ProgressData> { // Return ProgressData
    try {
      const now = new Date();
      let startDate: Date;
      let dateFormatOptions: Intl.DateTimeFormatOptions;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFormatOptions = { month: 'short', day: 'numeric' }; // e.g., Oct 29
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Start of month, 12 months ago
          dateFormatOptions = { year: 'numeric', month: 'short' };      // e.g., 2024 Oct
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Approx 30 days ago
          // startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Alternative fixed days
          dateFormatOptions = { month: 'short', day: 'numeric' };      // e.g., Oct 29
          break;
      }

      const startDateTimestamp = Timestamp.fromDate(startDate);

      // --- Fetch Data Concurrently ---
      const [sessionsSnapshot, assessmentsSnapshot, snapshotsSnapshot] = await Promise.all([
        // Get sessions (limit reasonably, filter/sort in client)
        getDocs(query(
          collection(db, 'sessions'),
          where('userId', '==', uid),
          where('startTime', '>=', startDateTimestamp), // Use Firestore timestamp for initial filter
          limit(150) // Adjust limit as needed
        )),
        // Get assessments (limit reasonably, filter/sort in client)
        getDocs(query(
          collection(db, 'assessments'),
          where('userId', '==', uid),
          where('completedAt', '>=', startDateTimestamp), // Use Firestore timestamp
          limit(100)
        )),
        // Get emotion snapshots (limit reasonably, filter/sort in client)
        getDocs(query(
          collection(db, 'emotionSnapshots'),
          where('userId', '==', uid),
          where('timestamp', '>=', startDateTimestamp), // Use Firestore timestamp
          limit(300) // Might need more snapshots for trend
        ))
      ]);
      // --- End Fetch Data ---

      // --- Process Sessions ---
      const sessions = sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startTime: (data.startTime as Timestamp)?.toDate(),
          endTime: (data.endTime as Timestamp)?.toDate(),
          // Ensure duration exists, default to 0
          duration: data.duration ?? 0,
          // Ensure outcomes exist
          outcomes: data.outcomes ?? { overallMood: 'stable' }
        };
      }).sort((a, b) => (b.startTime?.getTime() ?? 0) - (a.startTime?.getTime() ?? 0)); // Sort newest first
      // --- End Process Sessions ---

      // --- Process Assessments ---
      const assessments = assessmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          completedAt: (data.completedAt as Timestamp)?.toDate()
        };
      }).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)); // Sort newest first
      // --- End Process Assessments ---

      // --- Process Emotion Snapshots ---
      const emotionSnapshots = snapshotsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate()
        };
      }).sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0)); // Sort OLDEST first for charts
      // --- End Process Snapshots ---

      // --- Calculate Analytics (Mostly unchanged, using processed data) ---
      const calculatedSessions = {
        total: sessions.length,
        averageDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length || 0,
        emotionalTrend: this.calculateEmotionalTrendFromSnapshots(emotionSnapshots), // Use snapshots for trend now
        engagementLevel: this.calculateEngagementLevel(sessions)
      };

      const calculatedAssessments = {
        total: assessments.length,
        latestScores: this.getLatestAssessmentScores(assessments),
        progressTrend: this.calculateAssessmentTrend(assessments)
      };
      // --- End Calculate Analytics ---

      // --- Generate Chart Data ---
      const emotionalTrendChartData = this.formatEmotionalTrendChartData(emotionSnapshots, dateFormatOptions);
      const assessmentHistoryChartData = this.formatAssessmentHistoryChartData(assessments, dateFormatOptions);
      // --- End Generate Chart Data ---

      // --- Construct Final Result ---
      return {
        timeframe,
        sessions: calculatedSessions,
        assessments: calculatedAssessments,
        insights: this.generateInsights(sessions, assessments), // Keep existing insights generation
        emotionalTrendChartData,
        assessmentHistoryChartData,
      };
      // --- End Construct Final Result ---
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      // Return a default structure on error to avoid crashing the dashboard
      return {
        timeframe,
        sessions: { total: 0, averageDuration: 0, emotionalTrend: 'stable', engagementLevel: 0 },
        assessments: { total: 0, latestScores: { phq9: null, gad7: null }, progressTrend: { phq9: 'insufficient_data', gad7: 'insufficient_data' } },
        insights: ['Error loading data.'],
        emotionalTrendChartData: [],
        assessmentHistoryChartData: [],
      };
    }
  }

  // ==================== NEW CHART HELPER METHODS ====================

  // Calculate trend based on snapshots (more direct emotion data)
  private calculateEmotionalTrendFromSnapshots(snapshots: any[]): string {
    if (snapshots.length < 5) return 'stable'; // Need a few points

    // Simple trend: compare average "positivity" of first half vs second half
    const halfIndex = Math.floor(snapshots.length / 2);
    const firstHalf = snapshots.slice(0, halfIndex);
    const secondHalf = snapshots.slice(halfIndex);

    const calcAvgPositivity = (arr: any[]) => {
      if (arr.length === 0) return 0;
      const total = arr.reduce((sum, s) => {
        const e = s.emotions;
        // Simple positivity: joy - (sorrow + anger + fear + disgust)
        const score = (e?.joy ?? 0) - ((e?.sorrow ?? 0) + (e?.anger ?? 0) + (e?.fear ?? 0) + (e?.disgust ?? 0));
        return sum + score;
      }, 0);
      return total / arr.length;
    };

    const avgFirst = calcAvgPositivity(firstHalf);
    const avgSecond = calcAvgPositivity(secondHalf);

    if (avgSecond > avgFirst + 0.1) return 'improving';
    if (avgSecond < avgFirst - 0.1) return 'declining';
    return 'stable';
  }

  // Format snapshot data for the emotional trend chart
  private formatEmotionalTrendChartData(snapshots: any[], dateFormatOptions: Intl.DateTimeFormatOptions): DateValuePoint[] {
    if (!snapshots || snapshots.length === 0) return [];

    return snapshots.map(s => {
      const e = s.emotions;
      // Same simple positivity score used in trend calculation
      const score = (e?.joy ?? 0) - ((e?.sorrow ?? 0) + (e?.anger ?? 0) + (e?.fear ?? 0) + (e?.disgust ?? 0));
      // Normalize score roughly to 0-1 range (assuming input scores are 0-1)
      const normalizedScore = (score + 1) / 2; // Maps -1 to 0, 0 to 0.5, 1 to 1

      return {
        date: s.timestamp ? s.timestamp.toLocaleDateString('en-IN', dateFormatOptions) : 'Unknown',
        value: Math.max(0, Math.min(1, normalizedScore)) // Clamp between 0 and 1
      };
    });
  }

  // Format assessment data for the history chart
  private formatAssessmentHistoryChartData(assessments: any[], dateFormatOptions: Intl.DateTimeFormatOptions): AssessmentHistoryPoint[] {
    if (!assessments || assessments.length === 0) return [];

    // Sort OLDEST first for chart axis
    const sortedAssessments = [...assessments].sort((a, b) => (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0));

    return sortedAssessments.map(a => ({
      date: a.completedAt ? a.completedAt.toLocaleDateString('en-IN', dateFormatOptions) : 'Unknown',
      phq9: a.assessmentType === 'phq9' ? a.scores?.totalScore ?? null : null,
      gad7: a.assessmentType === 'gad7' ? a.scores?.totalScore ?? null : null,
    })).reduce((acc, current) => {
      // Combine results for the same date if multiple assessments were taken
      const existing = acc.find(item => item.date === current.date);
      if (existing) {
        if (current.phq9 !== null) existing.phq9 = current.phq9;
        if (current.gad7 !== null) existing.gad7 = current.gad7;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as AssessmentHistoryPoint[]);
  }

  // ==================== EXISTING HELPER METHODS (Unchanged) ====================

  // Get auth error message
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Calculate emotional trend (legacy method, kept for compatibility)
  private calculateEmotionalTrend(sessions: any[]): string {
    if (sessions.length < 2) return 'stable';

    const recentSessions = sessions.slice(0, 3);
    const olderSessions = sessions.slice(3, 6);

    const recentAvg = recentSessions.reduce((sum, s) => {
      const emotions = s.emotionalJourney || [];
      const avgValence = emotions.reduce((sum: number, e: any) => sum + (e.valence || 0), 0) / emotions.length || 0;
      return sum + avgValence;
    }, 0) / recentSessions.length || 0;

    const olderAvg = olderSessions.reduce((sum, s) => {
      const emotions = s.emotionalJourney || [];
      const avgValence = emotions.reduce((sum: number, e: any) => sum + (e.valence || 0), 0) / emotions.length || 0;
      return sum + avgValence;
    }, 0) / olderSessions.length || 0;

    if (recentAvg > olderAvg + 0.1) return 'improving';
    if (recentAvg < olderAvg - 0.1) return 'declining';
    return 'stable';
  }

  // Calculate engagement level
  private calculateEngagementLevel(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const avgInteractions = sessions.reduce((sum, s) => sum + (s.interactions?.length || 0), 0) / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;

    return Math.min(1, (avgInteractions * 0.1) + (avgDuration / 600000)); // Normalize to 0-1
  }

  // Get latest assessment scores
  private getLatestAssessmentScores(assessments: any[]): any {
    const latest = {
      phq9: null,
      gad7: null
    };

    for (const assessment of assessments) {
      if (assessment.assessmentType === 'phq9' && !latest.phq9) {
        latest.phq9 = assessment.scores.totalScore;
      }
      if (assessment.assessmentType === 'gad7' && !latest.gad7) {
        latest.gad7 = assessment.scores.totalScore;
      }
    }

    return latest;
  }

  // Calculate assessment trend
  private calculateAssessmentTrend(assessments: any[]): any {
    const phq9Assessments = assessments.filter(a => a.assessmentType === 'phq9');
    const gad7Assessments = assessments.filter(a => a.assessmentType === 'gad7');

    return {
      phq9: this.calculateScoreTrend(phq9Assessments),
      gad7: this.calculateScoreTrend(gad7Assessments)
    };
  }

  // Calculate score trend
  private calculateScoreTrend(assessments: any[]): string {
    if (assessments.length < 2) return 'insufficient_data';

    const latest = assessments[0]?.scores?.totalScore;
    const previous = assessments[1]?.scores?.totalScore;

    if (latest && previous) {
      if (latest < previous - 2) return 'improving';
      if (latest > previous + 2) return 'declining';
    }
    return 'stable';
  }

  // Generate insights
  private generateInsights(sessions: any[], assessments: any[]): string[] {
    const insights: string[] = [];

    if (sessions.length > 5) {
      insights.push('Consistent engagement with therapeutic sessions');
    }

    const emotionalTrend = this.calculateEmotionalTrend(sessions);
    if (emotionalTrend === 'improving') {
      insights.push('Emotional well-being showing positive trends');
    }

    if (assessments.length > 1) {
      const trend = this.calculateAssessmentTrend(assessments);
      if (trend.phq9 === 'improving' || trend.gad7 === 'improving') {
        insights.push('Assessment scores showing improvement');
      }
    }

    return insights;
  }

  // Delete user data (GDPR compliance)
  async deleteUserData(uid: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete user profile
      batch.delete(doc(db, 'users', uid));

      // Delete sessions
      const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete assessments
      const assessmentsQuery = query(collection(db, 'assessments'), where('userId', '==', uid));
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      assessmentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete crisis events
      const crisisQuery = query(collection(db, 'crisisEvents'), where('userId', '==', uid));
      const crisisSnapshot = await getDocs(crisisQuery);
      crisisSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // ==================== JOURNAL MANAGEMENT ====================

  // Create journal entry
  async createJournalEntry(entry: Omit<JournalEntry, 'entryId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'journal_entries'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  // Get user's journal entries (NO INDEX REQUIRED)
  async getJournalEntries(userId: string, limitCount: number = 50): Promise<JournalEntry[]> {
    try {
      // Simple query without composite index - just filter by userId
      const q = query(
        collection(db, 'journal_entries'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        entryId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as JournalEntry[];

      // Sort in memory by createdAt descending
      return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  }

  // Get mood entries
  async getMoodEntries(userId: string, limitCount: number = 50): Promise<MoodEntry[]> {
    try {
      const q = query(
        collection(db, 'mood_entries'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        entryId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as MoodEntry[];

      return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting mood entries:', error);
      throw error;
    }
  }

  // Get chat conversations
  async getChatConversations(userId: string, limitCount: number = 50): Promise<ChatConversation[]> {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        conversationId: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      })) as ChatConversation[];

      return conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  // Get progress data
  async getProgressData(userId: string, limitCount: number = 50): Promise<DailyProgressData[]> {
    try {
      const q = query(
        collection(db, 'progress_data'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const progressData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as DailyProgressData[];

      return progressData.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting progress data:', error);
      throw error;
    }
  }

  // Create conversation
  async createConversation(conversation: Omit<ChatConversation, 'conversationId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chat_conversations'), { // Use correct collection name
        ...conversation,
        startedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get latest mood entry
  async getLatestMoodEntry(userId: string): Promise<MoodEntry | null> {
    try {
      const entries = await this.getMoodEntries(userId, 1);
      return entries.length > 0 ? entries[0]! : null;
    } catch (error) {
      console.error('Error getting latest mood entry:', error);
      throw error;
    }
  }

  // Update journal entry
  async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
    try {
      const docRef = doc(db, 'journal_entries', entryId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  // Delete journal entry
  async deleteJournalEntry(entryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'journal_entries', entryId));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }


  async updateJournalEntryWithAIInsights(entryId: string, insights: JournalEntry['aiInsights']): Promise<void> {
    try {
      const docRef = doc(db, 'journal_entries', entryId);
      await updateDoc(docRef, {
        aiInsights: { // Ensure insights object is properly structured
          ...insights,
          analysisTimestamp: serverTimestamp() // Add timestamp in the function
        },
        updatedAt: serverTimestamp() // Also update the main entry timestamp
      });
      console.log(`🧠 AI Insights added to journal entry ${entryId}`);
    } catch (error) {
      console.error(`Error updating journal entry ${entryId} with AI insights:`, error);
      // Don't throw here, just log, as it's a background process
    }
  }
  // ==================== MOOD TRACKING ====================

  // Create mood entry
  async createMoodEntry(entry: Omit<MoodEntry, 'entryId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'mood_entries'), {
        ...entry,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      throw error;
    }
  }





  // ==================== CHAT CONVERSATIONS ====================



  // Add message to conversation
  async addMessage(message: Omit<ChatMessage, 'messageId'>): Promise<string> {
    try {
      const batch = writeBatch(db);
      const messageCol = collection(db, 'chat_messages'); // Use correct message collection name
      // Add message
      const messageRef = doc(messageCol);
      batch.set(messageRef, {
        ...message,
        timestamp: serverTimestamp()
      });

      // Update conversation last message time
      const conversationRef = doc(db, 'chat_conversations', message.conversationId); // Use correct conversation collection name
      batch.update(conversationRef, {
        lastMessageAt: serverTimestamp()
        // Optionally update title here if needed
      });

      await batch.commit();
      return messageRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get conversation messages (NO INDEX REQUIRED)
  async getConversationMessages(conversationId: string, limitCount: number = 100): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'chat_messages'), // Use correct collection name
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'), // Order chronologically
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date()
      })) as ChatMessage[];
      return messages;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // *** NEW: Listen to conversation messages (real-time, ordered) ***
  listenToConversationMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void,
    limitCount: number = 100
  ): () => void { // Returns an unsubscribe function
    const q = query(
      collection(db, 'chat_messages'), // Collection name correction
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'), // *** Order by timestamp ascending ***
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date() // Safer timestamp conversion
      })) as ChatMessage[];
      callback(messages);
    }, (error) => {
      console.error('Error listening to conversation messages:', error);
      onError(error);
    });
    return unsubscribe; // Return the unsubscribe function
  }

  // Get user conversations (NO INDEX REQUIRED)
  async getUserConversations(userId: string, limitCount: number = 50): Promise<ChatConversation[]> {
    try {
      const q = query(
        collection(db, 'chat_conversations'), // Collection name correction
        where('userId', '==', userId),
        orderBy('lastMessageAt', 'desc'), // *** Order by last message descending ***
        limit(limitCount) // Keep limit
      );
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        conversationId: doc.id,
        ...doc.data(),
        // Messages array likely not stored on conversation doc, remove if so
        // messages: [], // Clear messages array if it exists here
        startedAt: (doc.data().startedAt as Timestamp)?.toDate() || new Date(), // Safer conversion
        lastMessageAt: (doc.data().lastMessageAt as Timestamp)?.toDate() || new Date() // Safer conversion
      })) as ChatConversation[];
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }
  listenToUserConversations(
    userId: string,
    callback: (conversations: ChatConversation[]) => void,
    onError: (error: Error) => void,
    limitCount: number = 50
  ): () => void { // Returns an unsubscribe function
    const q = query(
      collection(db, 'chat_conversations'), // Collection name correction
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc'), // *** Order by last message descending ***
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => ({
        conversationId: doc.id,
        ...doc.data(),
        // messages: [], // Clear messages array if it exists here
        startedAt: (doc.data().startedAt as Timestamp)?.toDate() || new Date(), // Safer conversion
        lastMessageAt: (doc.data().lastMessageAt as Timestamp)?.toDate() || new Date() // Safer conversion
      })) as ChatConversation[];
      callback(conversations);
    }, (error) => {
      console.error('Error listening to user conversations:', error);
      onError(error);
    });

    return unsubscribe; // Return the unsubscribe function
  }
  // ==================== PROGRESS TRACKING ====================

  // Save daily progress
  async saveProgressData(progress: DailyProgressData): Promise<void> {
    try {
      const dateStr = progress.date.toISOString().split('T')[0];
      const docId = `${progress.userId}_${dateStr}`;

      await setDoc(doc(db, 'progress_tracking', docId), {
        ...progress,
        date: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving progress data:', error);
      throw error;
    }
  }



  // ==================== APP SETTINGS ====================

  // Save app settings
  async saveAppSettings(settings: AppSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'app_settings', settings.userId), settings);
    } catch (error) {
      console.error('Error saving app settings:', error);
      throw error;
    }
  }

  // Get app settings
  async getAppSettings(userId: string): Promise<AppSettings | null> {
    try {
      const docRef = doc(db, 'app_settings', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }

      // Return default settings if none exist
      return {
        userId,
        theme: 'auto',
        language: 'mixed',
        notifications: {
          enabled: true,
          dailyCheckIn: true,
          moodReminders: true,
          crisisAlerts: true,
          progressUpdates: true,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          }
        },
        privacy: {
          dataSharing: false,
          analytics: true,
          crashReporting: true,
          personalizedAds: false
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          screenReader: false,
          reducedMotion: false
        },
        aiPreferences: {
          personality: 'supportive',
          responseLength: 'detailed',
          culturalContext: true,
          hindiSupport: true
        }
      };
    } catch (error) {
      console.error('Error getting app settings:', error);
      throw error;
    }
  }

  // ==================== CRISIS MANAGEMENT ====================

  // Log crisis event
  async logCrisisEvent(event: Omit<CrisisEvent, 'eventId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'crisis_events'), {
        ...event,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error logging crisis event:', error);
      throw error;
    }
  }



  // ==================== ANALYTICS & INSIGHTS ====================

  // Get user analytics summary
  async getUserAnalytics(userId: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const [moodEntries, journalEntries, sessions, assessments] = await Promise.all([
        this.getMoodEntries(userId),
        this.getJournalEntries(userId, 100),
        this.getUserSessions(userId, 50),
        this.getUserAssessments(userId)
      ]);

      return {
        period: { startDate, endDate, days },
        mood: {
          averageMood: moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length || 0,
          moodTrend: this.calculateMoodTrend(moodEntries),
          totalEntries: moodEntries.length
        },
        journal: {
          totalEntries: journalEntries.length,
          averageWordsPerEntry: journalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / journalEntries.length || 0,
          mostCommonEmotions: this.getMostCommonEmotions(journalEntries)
        },
        sessions: {
          totalSessions: sessions.length,
          averageDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length || 0,
          sessionTypes: this.getSessionTypeBreakdown(sessions)
        },
        assessments: {
          latestScores: this.getLatestAssessmentScores(assessments),
          progressTrend: this.calculateAssessmentTrend(assessments)
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Helper methods for analytics
  private calculateMoodTrend(moodEntries: MoodEntry[]): 'improving' | 'stable' | 'declining' {
    if (moodEntries.length < 7) return 'stable';

    const recent = moodEntries.slice(0, 7);
    const older = moodEntries.slice(7, 14);

    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  private getMostCommonEmotions(journalEntries: JournalEntry[]): string[] {
    const emotionCounts: { [emotion: string]: number } = {};

    journalEntries.forEach(entry => {
      entry.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);
  }

  private getSessionTypeBreakdown(sessions: SessionData[]): { [type: string]: number } {
    const breakdown: { [type: string]: number } = {};

    sessions.forEach(session => {
      breakdown[session.sessionType] = (breakdown[session.sessionType] || 0) + 1;
    });

    return breakdown;
  }


}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;