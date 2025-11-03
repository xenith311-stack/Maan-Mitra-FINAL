import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Camera, CameraOff, Download, Eye } from 'lucide-react';
import { emotionDetection, type EmotionDetectionResult } from '../services/emotionDetection';

interface EmotionSession {
  id: string;
  startTime: Date;
  results: EmotionDetectionResult[];
  duration: number;
}

export default function EmotionDetection() {
  const [isActive, setIsActive] = useState(false);
  const [currentResult, setCurrentResult] = useState<EmotionDetectionResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<EmotionSession[]>([]);
  const [currentSession, setCurrentSession] = useState<EmotionSession | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer for session tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && currentSession) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, currentSession]);

  const startDetection = async () => {
    try {
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Start new session
      const session: EmotionSession = {
        id: Date.now().toString(),
        startTime: new Date(),
        results: [],
        duration: 0
      };
      setCurrentSession(session);
      setSessionTime(0);
      setIsActive(true);

      // Start emotion detection
      await emotionDetection.startRealTimeAnalysis(
        (result: EmotionDetectionResult) => {
          setCurrentResult(result);
          
          // Add to current session
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              results: [...currentSession.results, result]
            };
            setCurrentSession(updatedSession);
          }
        },
        {
          interval: 2000, // Analyze every 2 seconds
          culturalContext: 'indian',
          sensitivity: 'medium'
        }
      );

    } catch (error) {
      console.error('Camera access error:', error);
      setError('Failed to access camera. Please ensure camera permissions are enabled.');
      setIsActive(false);
    }
  };

  const stopDetection = () => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop emotion detection
    emotionDetection.stopRealTimeAnalysis();

    // Save session to history
    if (currentSession) {
      const finalSession = {
        ...currentSession,
        duration: sessionTime
      };
      setSessionHistory(prev => [...prev, finalSession]);
    }

    setIsActive(false);
    setCurrentResult(null);
    setCurrentSession(null);
    setSessionTime(0);
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0);

    // Convert to blob and analyze
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const result = await emotionDetection.analyzeImage(blob);
        setCurrentResult(result);

        // Add to session if active
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            results: [...currentSession.results, result]
          };
          setCurrentSession(updatedSession);
        }
      } catch (error) {
        console.error('Snapshot analysis error:', error);
        setError('Failed to analyze snapshot. Please try again.');
      }
    }, 'image/jpeg', 0.8);
  };

  const downloadResults = () => {
    if (!currentSession) return;

    const data = {
      session: currentSession,
      summary: generateSessionSummary(currentSession)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-analysis-${currentSession.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSessionSummary = (session: EmotionSession) => {
    if (session.results.length === 0) return null;

    const emotions = session.results.map(r => r.primaryEmotion);
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .reduce((a, b) => (emotionCounts[a[0]] || 0) > (emotionCounts[b[0]] || 0) ? a : b)[0];

    const avgConfidence = session.results.reduce((sum, r) => sum + r.confidence, 0) / session.results.length;
    const avgStress = session.results.reduce((sum, r) => sum + r.wellnessIndicators.stressLevel, 0) / session.results.length;
    const avgEngagement = session.results.reduce((sum, r) => sum + r.wellnessIndicators.engagementLevel, 0) / session.results.length;

    return {
      dominantEmotion,
      averageConfidence: Math.round(avgConfidence * 100),
      averageStressLevel: Math.round(avgStress * 100),
      averageEngagement: Math.round(avgEngagement * 100),
      totalAnalyses: session.results.length,
      duration: session.duration,
      recommendations: session.results[session.results.length - 1]?.recommendations || { immediate: [], therapeutic: [] }
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      joy: 'text-yellow-600 bg-yellow-100',
      sorrow: 'text-blue-600 bg-blue-100',
      anger: 'text-red-600 bg-red-100',
      fear: 'text-purple-600 bg-purple-100',
      surprise: 'text-green-600 bg-green-100',
      disgust: 'text-gray-600 bg-gray-100'
    };
    return colors[emotion as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Emotion Detection</h1>
        <p className="text-gray-600">
          Real-time facial emotion analysis for mental health assessment and self-awareness
        </p>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Camera Feed</h2>
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-sm text-gray-600">
                  {formatTime(sessionTime)}
                </span>
              )}
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex items-center gap-3">
            <Button
              onClick={isActive ? stopDetection : startDetection}
              className={isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
            >
              {isActive ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
              {isActive ? 'Stop Detection' : 'Start Detection'}
            </Button>

            {isActive && (
              <Button variant="outline" onClick={captureSnapshot}>
                <Eye className="w-4 h-4 mr-2" />
                Analyze Now
              </Button>
            )}

            {currentSession && currentSession.results.length > 0 && (
              <Button variant="outline" onClick={downloadResults}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </Card>

        {/* Current Analysis */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Analysis</h2>
          
          {currentResult ? (
            <div className="space-y-4">
              {/* Primary Emotion */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Emotion</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(currentResult.primaryEmotion)}`}>
                  {currentResult.primaryEmotion}
                  <span className="ml-2 text-xs">
                    {Math.round(currentResult.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Emotion Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emotion Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(currentResult.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{emotion}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${value * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wellness Indicators */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Wellness Indicators</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(currentResult.wellnessIndicators.stressLevel * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Stress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round((1 - currentResult.wellnessIndicators.fatigueLevel) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(currentResult.wellnessIndicators.engagementLevel * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Facial Features Analysis */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Facial Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Eye Contact</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${currentResult.facialFeatures.eyeContact ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {currentResult.facialFeatures.eyeContact ? '👁️ Present' : '👁️ Limited'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Facial Tension</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {Math.round(currentResult.facialFeatures.facialTension * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentResult.facialFeatures.facialTension > 0.7 ? 'bg-red-500' :
                          currentResult.facialFeatures.facialTension > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${currentResult.facialFeatures.facialTension * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Micro-expressions */}
                {currentResult.facialFeatures.microExpressions.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-600 block mb-2">Micro-expressions detected:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentResult.facialFeatures.microExpressions.map((expression, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                          {expression}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Wellness Visualization */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Wellness Dashboard</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">😰</span>
                      <span className="text-sm font-medium text-red-800">Stress Level</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">
                        {Math.round(currentResult.wellnessIndicators.stressLevel * 100)}%
                      </div>
                      <div className="text-xs text-red-600">
                        {currentResult.wellnessIndicators.stressLevel > 0.7 ? 'High' :
                         currentResult.wellnessIndicators.stressLevel > 0.4 ? 'Moderate' : 'Low'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span className="text-sm font-medium text-green-800">Energy Level</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        {Math.round((1 - currentResult.wellnessIndicators.fatigueLevel) * 100)}%
                      </div>
                      <div className="text-xs text-green-600">
                        {(1 - currentResult.wellnessIndicators.fatigueLevel) > 0.7 ? 'High' :
                         (1 - currentResult.wellnessIndicators.fatigueLevel) > 0.4 ? 'Moderate' : 'Low'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-sm font-medium text-blue-800">Engagement</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-700">
                        {Math.round(currentResult.wellnessIndicators.engagementLevel * 100)}%
                      </div>
                      <div className="text-xs text-blue-600">
                        {currentResult.wellnessIndicators.engagementLevel > 0.7 ? 'High' :
                         currentResult.wellnessIndicators.engagementLevel > 0.4 ? 'Moderate' : 'Low'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {currentResult.recommendations.immediate.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Personalized Recommendations</h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                    <ul className="space-y-2">
                      {currentResult.recommendations.immediate.map((rec, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No analysis available</p>
              <p className="text-sm text-gray-400">Start detection to begin emotion analysis</p>
            </div>
          )}
        </Card>
      </div>

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session History</h2>
          <div className="space-y-3">
            {sessionHistory.slice(-5).reverse().map((session) => {
              const summary = generateSessionSummary(session);
              return (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTime(session.duration)} • {session.results.length} analyses
                    </span>
                  </div>
                  {summary && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Dominant: <span className="font-medium">{summary.dominantEmotion}</span></span>
                      <span>Confidence: {summary.averageConfidence}%</span>
                      <span>Stress: {summary.averageStressLevel}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}