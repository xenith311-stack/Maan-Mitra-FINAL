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
  writeBatch
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
  interactions: Array<{
    timestamp: Date;
    type: 'user_message' | 'ai_response' | 'emotion_detected' | 'voice_analysis';
    content: string;
    metadata: any;
  }>;
  emotionalJourney: Array<{
    timestamp: Date;
    primaryEmotion: string;
    intensity: number;
    valence: number;
    arousal: number;
    confidence: number;
    source: 'text' | 'voice' | 'facial';
  }>;
  progressMetrics: {
    emotionalRegulation: number;
    selfAwareness: number;
    copingSkillsUsage: number;
    therapeuticAlliance: number;
    engagementLevel: number;
  };
  riskAssessments: Array<{
    timestamp: Date;
    level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    indicators: string[];
    interventions: string[];
  }>;
  outcomes: {
    overallMood: 'improved' | 'stable' | 'declined';
    goalsAddressed: string[];
    skillsPracticed: string[];
    insightsGained: string[];
  };
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
  messages: ChatMessage[];
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
    emotions?: string[];
    riskLevel?: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    aiModel?: string;
    responseTime?: number;
  };
}

// Progress Tracking Interface
export interface ProgressData {
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

  // Create new session
  async createSession(sessionData: Omit<SessionData, 'sessionId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Update session
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      // Strip undefined to avoid Firestore errors
      const sanitized: Record<string, any> = {};
      Object.entries(updates || {}).forEach(([k, v]) => {
        if (v !== undefined) sanitized[k] = v;
      });
      await updateDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  // End session
  async endSession(sessionId: string, finalData: Partial<SessionData>): Promise<void> {
    try {
      const docRef = doc(db, 'sessions', sessionId);
      await updateDoc(docRef, {
        ...finalData,
        endTime: serverTimestamp(),
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending session:', error);
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

  // ==================== ANALYTICS & INSIGHTS ====================

  // Get user progress analytics
  async getUserProgressAnalytics(uid: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get sessions in timeframe (NO INDEX REQUIRED)
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', uid),
        limit(100)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      let sessions = sessionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));

      // Filter by date range in memory
      sessions = sessions.filter(session => {
        const sessionDate = session.startTime;
        return sessionDate && sessionDate >= startDate;
      });

      // Get assessments in timeframe (NO INDEX REQUIRED)
      const assessmentsQuery = query(
        collection(db, 'assessments'),
        where('userId', '==', uid),
        limit(100)
      );

      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      let assessments = assessmentsSnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate()
      }));

      // Filter assessments by date range in memory
      assessments = assessments.filter(assessment => {
        const assessmentDate = assessment.completedAt;
        return assessmentDate && assessmentDate >= startDate;
      });

      return {
        timeframe,
        sessions: {
          total: sessions.length,
          averageDuration: sessions.reduce((sum, s) => sum + ((s as any).duration || 0), 0) / sessions.length || 0,
          emotionalTrend: this.calculateEmotionalTrend(sessions),
          engagementLevel: this.calculateEngagementLevel(sessions)
        },
        assessments: {
          total: assessments.length,
          latestScores: this.getLatestAssessmentScores(assessments),
          progressTrend: this.calculateAssessmentTrend(assessments)
        },
        insights: this.generateInsights(sessions, assessments)
      };
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

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

  // Calculate emotional trend
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
  async getProgressData(userId: string, limitCount: number = 50): Promise<ProgressData[]> {
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
      })) as ProgressData[];

      return progressData.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting progress data:', error);
      throw error;
    }
  }

  // Create conversation
  async createConversation(conversation: Omit<ChatConversation, 'conversationId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
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

      // Add message
      const messageRef = doc(collection(db, 'messages'));
      batch.set(messageRef, {
        ...message,
        timestamp: serverTimestamp()
      });

      // Update conversation last message time
      const conversationRef = doc(db, 'conversations', message.conversationId);
      batch.update(conversationRef, {
        lastMessageAt: serverTimestamp()
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
        collection(db, 'chat_messages'),
        where('conversationId', '==', conversationId),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ChatMessage[];

      // Sort in memory by timestamp ascending
      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Get user conversations (NO INDEX REQUIRED)
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const q = query(
        collection(db, 'chat_conversations'),
        where('userId', '==', userId),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        conversationId: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      })) as ChatConversation[];

      // Sort in memory by lastMessageAt descending
      return conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // ==================== PROGRESS TRACKING ====================

  // Save daily progress
  async saveProgressData(progress: ProgressData): Promise<void> {
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