import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2, Settings, Info } from 'lucide-react';
import { LiveEmotionDashboard } from './LiveEmotionDashboard';
import { type EmotionDetectionResult } from '../services/emotionDetection';
import { toast } from 'sonner';
import { useAuth } from './auth/AuthProvider';
import { firebaseService, db } from '../services/firebaseService';
import { collection, addDoc } from 'firebase/firestore';

interface LiveEmotionPageProps {
  navigateTo?: (screen: string) => void;
}

interface EmotionSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  emotions: Array<{
    timestamp: Date;
    emotion: string;
    confidence: number;
    stressLevel: number;
    engagementLevel: number;
  }>;
  averageStress: number;
  dominantEmotion: string;
  totalFrames: number;
}

export const LiveEmotionPage: React.FC<LiveEmotionPageProps> = ({ navigateTo }) => {
  const [currentSession, setCurrentSession] = useState<EmotionSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<EmotionSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const { currentUser } = useAuth();

  // Start a new session
  const startNewSession = () => {
    const newSession: EmotionSession = {
      sessionId: `session_${Date.now()}`,
      startTime: new Date(),
      emotions: [],
      averageStress: 0,
      dominantEmotion: 'neutral',
      totalFrames: 0
    };
    setCurrentSession(newSession);
    toast.success('New emotion tracking session started');
  };

  // End current session
  const endCurrentSession = async () => {
    if (!currentSession) return;

    const endedSession: EmotionSession = {
      ...currentSession,
      endTime: new Date(),
      averageStress: currentSession.emotions.length > 0 
        ? currentSession.emotions.reduce((sum, e) => sum + e.stressLevel, 0) / currentSession.emotions.length
        : 0,
      dominantEmotion: getDominantEmotion(currentSession.emotions)
    };

    setSessionHistory(prev => [...prev, endedSession]);
    
    // Save to Firebase if user is logged in and auto-save is enabled
    if (currentUser && autoSave) {
      try {
        await saveSessionToFirebase(endedSession);
        toast.success('Session saved to your profile');
      } catch (error) {
        console.error('Failed to save session:', error);
        toast.error('Failed to save session data');
      }
    }

    setCurrentSession(null);
    toast.info('Emotion tracking session ended');
  };

  // Handle emotion updates from the dashboard
  const handleEmotionUpdate = (emotion: EmotionDetectionResult) => {
    if (!currentSession) {
      startNewSession();
      return;
    }

    const emotionEntry = {
      timestamp: new Date(),
      emotion: emotion.primaryEmotion,
      confidence: emotion.confidence,
      stressLevel: emotion.wellnessIndicators.stressLevel,
      engagementLevel: emotion.wellnessIndicators.engagementLevel
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      emotions: [...prev.emotions, emotionEntry],
      totalFrames: prev.totalFrames + 1
    } : null);
  };

  // Get dominant emotion from session data
  const getDominantEmotion = (emotions: EmotionSession['emotions']): string => {
    if (emotions.length === 0) return 'neutral';
    
    const emotionCounts: { [key: string]: number } = {};
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  };

  // Save session to Firebase
  const saveSessionToFirebase = async (session: EmotionSession) => {
    if (!currentUser) return;

    const sessionData = {
      userId: currentUser.uid,
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime || new Date(),
      duration: session.endTime 
        ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60 // minutes
        : 0,
      totalFrames: session.totalFrames,
      averageStress: session.averageStress,
      dominantEmotion: session.dominantEmotion,
      emotionData: session.emotions,
      createdAt: new Date()
    };

    // Save to a dedicated collection for emotion sessions
    await addDoc(collection(db, 'emotion_sessions'), sessionData);
  };

  // Export session data
  const exportSessionData = (session: EmotionSession) => {
    const data = {
      sessionInfo: {
        id: session.sessionId,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: session.endTime 
          ? `${Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)} minutes`
          : 'Ongoing',
        totalFrames: session.totalFrames,
        averageStress: Math.round(session.averageStress * 100),
        dominantEmotion: session.dominantEmotion
      },
      emotionData: session.emotions.map(e => ({
        timestamp: e.timestamp.toISOString(),
        emotion: e.emotion,
        confidence: Math.round(e.confidence * 100),
        stressLevel: Math.round(e.stressLevel * 100),
        engagementLevel: Math.round(e.engagementLevel * 100)
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion_session_${session.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Session data exported');
  };

  // Format duration
  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const diff = endTime.getTime() - start.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {navigateTo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo('dashboard')}
                className="rounded-xl hover:bg-white/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Live Emotion Detection
              </h1>
              <p className="text-gray-600 mt-1">Real-time facial emotion analysis and wellness monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            
            {currentSession && (
              <Button
                variant="destructive"
                size="sm"
                onClick={endCurrentSession}
                className="rounded-xl"
              >
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-3">Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-save sessions to profile</span>
              </label>
            </div>
          </Card>
        )}

        {/* Current Session Info */}
        {currentSession && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Active Session</h3>
                <div className="flex items-center gap-4 text-sm text-green-700">
                  <span>Duration: {formatDuration(currentSession.startTime)}</span>
                  <span>Frames: {currentSession.totalFrames}</span>
                  <span>Emotions: {currentSession.emotions.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Recording</span>
              </div>
            </div>
          </Card>
        )}

        {/* Live Dashboard */}
        <LiveEmotionDashboard 
          onEmotionUpdate={handleEmotionUpdate}
          className="w-full"
        />

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Session History
            </h3>
            <div className="space-y-3">
              {sessionHistory.slice(-5).reverse().map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-medium">
                        {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Duration: {formatDuration(session.startTime, session.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Dominant: <span className="capitalize font-medium">{session.dominantEmotion}</span></span>
                      <span>Avg Stress: {Math.round(session.averageStress * 100)}%</span>
                      <span>Frames: {session.totalFrames}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSessionData(session)}
                      className="rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">How it works</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Uses your camera to detect facial expressions in real-time</p>
                <p>• Analyzes emotions: joy, sorrow, anger, surprise, fear, and more</p>
                <p>• Monitors wellness indicators like stress and engagement levels</p>
                <p>• Provides immediate feedback and recommendations</p>
                <p>• All processing happens locally - your video never leaves your device</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiveEmotionPage;