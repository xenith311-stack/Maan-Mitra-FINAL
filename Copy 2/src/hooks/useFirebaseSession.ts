import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { firebaseService, SessionData } from '../services/firebaseService';

interface UseFirebaseSessionReturn {
  currentSession: SessionData | null;
  isSessionActive: boolean;
  startSession: (sessionType: SessionData['sessionType']) => Promise<string>;
  endSession: () => Promise<void>;
  updateSession: (updates: Partial<SessionData>) => Promise<void>;
  addInteraction: (interaction: {
    type: 'user_message' | 'ai_response' | 'emotion_detected' | 'voice_analysis';
    content: string;
    metadata?: any;
  }) => Promise<void>;
  addEmotionalDataPoint: (emotion: {
    primaryEmotion: string;
    intensity: number;
    valence: number;
    arousal: number;
    confidence: number;
    source: 'text' | 'voice' | 'facial';
  }) => Promise<void>;
  recordCrisisEvent: (event: {
    severity: 'moderate' | 'high' | 'severe';
    triggerMessage: string;
    detectedIndicators: string[];
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useFirebaseSession = (): UseFirebaseSessionReturn => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth();

  const isSessionActive = currentSession !== null && !currentSession.endTime;

  // Start a new session
  const startSession = useCallback(async (sessionType: SessionData['sessionType']): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionData = {
        userId: currentUser.uid,
        startTime: new Date(),
        duration: 0,
        sessionType,
        interactions: [],
        emotionalJourney: [],
        progressMetrics: {
          emotionalRegulation: 0.5,
          selfAwareness: 0.5,
          copingSkillsUsage: 0.5,
          therapeuticAlliance: 0.5,
          engagementLevel: 0.5
        },
        riskAssessments: [],
        outcomes: {
          overallMood: 'stable' as const,
          goalsAddressed: [],
          skillsPracticed: [],
          insightsGained: []
        }
      };

      const sessionId = await firebaseService.createSession(sessionData);
      
      const newSession: SessionData = {
        sessionId,
        ...sessionData
      };
      
      setCurrentSession(newSession);
      return sessionId;
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // End the current session
  const endSession = useCallback(async (): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session to end');
    }

    setLoading(true);
    setError(null);

    try {
      const duration = Date.now() - currentSession.startTime.getTime();
      
      await firebaseService.endSession(currentSession.sessionId, {
        duration,
        endTime: new Date(),
        outcomes: {
          overallMood: 'stable',
          goalsAddressed: currentSession.outcomes.goalsAddressed,
          skillsPracticed: currentSession.outcomes.skillsPracticed,
          insightsGained: currentSession.outcomes.insightsGained
        }
      });

      setCurrentSession(null);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  // Update session data
  const updateSession = useCallback(async (updates: Partial<SessionData>): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session to update');
    }

    setError(null);

    try {
      await firebaseService.updateSession(currentSession.sessionId, updates);
      
      // Update local session state
      setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentSession]);

  // Add interaction to current session
  const addInteraction = useCallback(async (interaction: {
    type: 'user_message' | 'ai_response' | 'emotion_detected' | 'voice_analysis';
    content: string;
    metadata?: any;
  }): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    const newInteraction = {
      timestamp: new Date(),
      ...interaction,
      metadata: interaction.metadata ?? {}
    };

    try {
      const updatedInteractions = [...currentSession.interactions, newInteraction];
      
      await firebaseService.updateSession(currentSession.sessionId, {
        interactions: updatedInteractions
      });

      // Update local state
      setCurrentSession(prev => prev ? {
        ...prev,
        interactions: updatedInteractions
      } : null);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentSession]);

  // Add emotional data point
  const addEmotionalDataPoint = useCallback(async (emotion: {
    primaryEmotion: string;
    intensity: number;
    valence: number;
    arousal: number;
    confidence: number;
    source: 'text' | 'voice' | 'facial';
  }): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    const emotionalDataPoint = {
      timestamp: new Date(),
      ...emotion
    };

    try {
      const updatedJourney = [...currentSession.emotionalJourney, emotionalDataPoint];
      
      await firebaseService.updateSession(currentSession.sessionId, {
        emotionalJourney: updatedJourney
      });

      // Update local state
      setCurrentSession(prev => prev ? {
        ...prev,
        emotionalJourney: updatedJourney
      } : null);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentSession]);

  // Record crisis event
  const recordCrisisEvent = useCallback(async (event: {
    severity: 'moderate' | 'high' | 'severe';
    triggerMessage: string;
    detectedIndicators: string[];
  }): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      await firebaseService.recordCrisisEvent({
        userId: currentUser.uid,
        timestamp: new Date(),
        severity: event.severity,
        triggerMessage: event.triggerMessage,
        detectedIndicators: event.detectedIndicators,
        interventionsTaken: [],
        professionalReferral: event.severity === 'severe',
        followUpScheduled: event.severity !== 'moderate',
        resolution: 'pending'
      });

      // Add risk assessment to current session if active
      if (currentSession) {
        const riskAssessment = {
          timestamp: new Date(),
          level: event.severity as 'moderate' | 'high' | 'severe',
          indicators: event.detectedIndicators,
          interventions: [],
          followUpRequired: true,
          professionalReferral: event.severity === 'severe'
        };

        const updatedRiskAssessments = [...currentSession.riskAssessments, riskAssessment];
        
        await firebaseService.updateSession(currentSession.sessionId, {
          riskAssessments: updatedRiskAssessments
        });

        setCurrentSession(prev => prev ? {
          ...prev,
          riskAssessments: updatedRiskAssessments
        } : null);
      }
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentUser, currentSession]);

  // Check for existing active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!currentUser) return;

      try {
        const recentSessions = await firebaseService.getUserSessions(currentUser.uid, 1);
        const lastSession = recentSessions[0];
        
        // If the last session doesn't have an end time, it's still active
        if (lastSession && !lastSession.endTime) {
          setCurrentSession(lastSession);
        }
      } catch (err: any) {
        console.error('Error checking active session:', err);
        setError(err.message);
      }
    };

    checkActiveSession();
  }, [currentUser]);

  return {
    currentSession,
    isSessionActive,
    startSession,
    endSession,
    updateSession,
    addInteraction,
    addEmotionalDataPoint,
    recordCrisisEvent,
    loading,
    error
  };
};