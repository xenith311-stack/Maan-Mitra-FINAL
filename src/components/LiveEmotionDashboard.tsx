// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Card } from './ui/card';
// import { Button } from './ui/button';
// import { Camera, CameraOff, Activity, AlertCircle, Heart, Brain, Eye, Zap } from 'lucide-react';
// import { emotionDetection, type EmotionDetectionResult } from '../services/emotionDetection';
// import { toast } from 'sonner';

// interface LiveEmotionDashboardProps {
//   onEmotionUpdate?: (emotion: EmotionDetectionResult) => void;
//   className?: string;
// }

// interface EmotionHistory {
//   timestamp: Date;
//   emotion: string;
//   confidence: number;
//   stressLevel: number;
// }

// export const LiveEmotionDashboard: React.FC<LiveEmotionDashboardProps> = ({
//   onEmotionUpdate,
//   className = ""
// }) => {
//   const [isActive, setIsActive] = useState(false);
//   const [currentEmotion, setCurrentEmotion] = useState<EmotionDetectionResult | null>(null);
//   const [emotionHistory, setEmotionHistory] = useState<EmotionHistory[]>([]);
//   const [frameCount, setFrameCount] = useState(0);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   // Emotion icons mapping
//   const getEmotionIcon = (emotion: string) => {
//     const icons: { [key: string]: string } = {
//       joy: '😊',
//       happiness: '😊',
//       sorrow: '😢',
//       sadness: '😢',
//       anger: '😠',
//       surprise: '😲',
//       fear: '😰',
//       disgust: '🤢',
//       neutral: '😐',
//       none: '😶'
//     };
//     return icons[emotion.toLowerCase()] || '😐';
//   };

//   // Get emotion color
//   const getEmotionColor = (emotion: string) => {
//     const colors: { [key: string]: string } = {
//       joy: 'text-yellow-600 bg-yellow-50 border-yellow-200',
//       happiness: 'text-yellow-600 bg-yellow-50 border-yellow-200',
//       sorrow: 'text-blue-600 bg-blue-50 border-blue-200',
//       sadness: 'text-blue-600 bg-blue-50 border-blue-200',
//       anger: 'text-red-600 bg-red-50 border-red-200',
//       surprise: 'text-green-600 bg-green-50 border-green-200',
//       fear: 'text-purple-600 bg-purple-50 border-purple-200',
//       disgust: 'text-orange-600 bg-orange-50 border-orange-200',
//       neutral: 'text-gray-600 bg-gray-50 border-gray-200',
//       none: 'text-gray-400 bg-gray-50 border-gray-200'
//     };
//     return colors[emotion.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
//   };

//   // Start live emotion detection with video preview
//   const startDetection = useCallback(async () => {
//     if (!emotionDetection.isServiceAvailable()) {
//       toast.error('Camera or emotion detection service not available');
//       return;
//     }

//     setIsInitializing(true);
    
//     try {
//       // Get camera stream for video preview
//       const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           width: { ideal: 640 },
//           height: { ideal: 480 },
//           facingMode: 'user'
//         }
//       });

//       setStream(mediaStream);

//       // Set video source
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//       }

//       // Start real-time analysis
//       await emotionDetection.startRealTimeAnalysis(
//         (result) => {
//           console.log('Live emotion detected:', result);
          
//           setCurrentEmotion(result);
//           setFrameCount(prev => prev + 1);
          
//           // Add to history (keep last 20 entries)
//           setEmotionHistory(prev => {
//             const newEntry: EmotionHistory = {
//               timestamp: new Date(),
//               emotion: result.primaryEmotion,
//               confidence: result.confidence,
//               stressLevel: result.wellnessIndicators.stressLevel
//             };
//             return [...prev.slice(-19), newEntry];
//           });

//           // Notify parent component
//           onEmotionUpdate?.(result);

//           // Show alerts for high stress
//           if (result.wellnessIndicators.stressLevel > 0.8) {
//             toast.warning('High stress level detected. Consider taking a break.');
//           }
//         },
//         {
//           interval: 1000, // Analyze every 1 second for live feedback
//           culturalContext: 'indian'
//         }
//       );

//       setIsActive(true);
//       setIsInitializing(false);
//       toast.success('Live emotion detection started');

//     } catch (error) {
//       console.error('Failed to start emotion detection:', error);
//       toast.error('Failed to start camera. Please check permissions.');
//       setIsInitializing(false);
//     }
//   }, [onEmotionUpdate]);

//   // Stop detection and video
//   const stopDetection = useCallback(() => {
//     emotionDetection.stopRealTimeAnalysis();
    
//     // Stop video stream
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//       setStream(null);
//     }

//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }

//     setIsActive(false);
//     setCurrentEmotion(null);
//     setFrameCount(0);
//     toast.info('Live emotion detection stopped');
//   }, [stream]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (isActive) {
//         emotionDetection.stopRealTimeAnalysis();
//       }
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [isActive, stream]);

//   // Get wellness status
//   const getWellnessStatus = () => {
//     if (!currentEmotion) return { status: 'unknown', color: 'gray', message: 'No data' };
    
//     const stress = currentEmotion.wellnessIndicators.stressLevel;
//     const engagement = currentEmotion.wellnessIndicators.engagementLevel;
    
//     if (stress > 0.7) {
//       return { status: 'high-stress', color: 'red', message: 'High stress detected' };
//     } else if (stress > 0.4) {
//       return { status: 'moderate-stress', color: 'yellow', message: 'Moderate stress' };
//     } else if (engagement > 0.6) {
//       return { status: 'good', color: 'green', message: 'Good emotional state' };
//     } else {
//       return { status: 'low-energy', color: 'blue', message: 'Low energy detected' };
//     }
//   };

//   const wellnessStatus = getWellnessStatus();

//   return (
//     <div className={`space-y-4 ${className}`}>
//       {/* Main Control Card */}
//       <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 shadow-lg">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
//               <Camera className="w-5 h-5" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800">Live Emotion Detection</h3>
//               <p className="text-sm text-gray-600">Real-time facial emotion analysis</p>
//             </div>
//           </div>
          
//           <Button
//             onClick={isActive ? stopDetection : startDetection}
//             disabled={isInitializing}
//             variant={isActive ? "destructive" : "default"}
//             className={`rounded-xl transition-all duration-200 ${
//               isActive 
//                 ? "bg-red-500 hover:bg-red-600 shadow-lg" 
//                 : "bg-green-500 hover:bg-green-600 shadow-lg"
//             }`}
//           >
//             {isInitializing ? (
//               <>
//                 <Activity className="w-4 h-4 mr-2 animate-spin" />
//                 Starting...
//               </>
//             ) : isActive ? (
//               <>
//                 <CameraOff className="w-4 h-4 mr-2" />
//                 Stop Detection
//               </>
//             ) : (
//               <>
//                 <Camera className="w-4 h-4 mr-2" />
//                 Start Detection
//               </>
//             )}
//           </Button>
//         </div>

//         {/* Status Indicator */}
//         <div className="flex items-center gap-2 mb-4">
//           <div className={`w-3 h-3 rounded-full ${
//             isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
//           }`}></div>
//           <span className="text-sm font-medium text-gray-700">
//             {isActive ? `Active • ${frameCount} frames analyzed` : 'Inactive'}
//           </span>
//         </div>

//         {/* Live Video Preview */}
//         {isActive && (
//           <div className="mb-4">
//             <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '4/3', maxWidth: '400px', margin: '0 auto' }}>
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//               />
//               <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
//                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//                 <span className="text-white text-sm font-medium">LIVE</span>
//               </div>
//               {currentEmotion && (
//                 <div className="absolute bottom-3 left-3 px-3 py-2 bg-black/70 rounded-xl">
//                   <div className="flex items-center gap-2">
//                     <span className="text-2xl">{getEmotionIcon(currentEmotion.primaryEmotion)}</span>
//                     <div className="text-white">
//                       <p className="text-sm font-semibold capitalize">{currentEmotion.primaryEmotion}</p>
//                       <p className="text-xs opacity-75">{Math.round(currentEmotion.confidence * 100)}% confidence</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Current Emotion Display */}
//         {currentEmotion && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Primary Emotion */}
//             <div className={`p-4 rounded-xl border-2 ${getEmotionColor(currentEmotion.primaryEmotion)}`}>
//               <div className="flex items-center gap-3 mb-2">
//                 <span className="text-2xl">{getEmotionIcon(currentEmotion.primaryEmotion)}</span>
//                 <div>
//                   <p className="font-semibold capitalize">{currentEmotion.primaryEmotion}</p>
//                   <p className="text-sm opacity-75">
//                     {Math.round(currentEmotion.confidence * 100)}% confidence
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Wellness Status */}
//             <div className={`p-4 rounded-xl border-2 ${
//               wellnessStatus.color === 'red' ? 'text-red-600 bg-red-50 border-red-200' :
//               wellnessStatus.color === 'yellow' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
//               wellnessStatus.color === 'green' ? 'text-green-600 bg-green-50 border-green-200' :
//               'text-blue-600 bg-blue-50 border-blue-200'
//             }`}>
//               <div className="flex items-center gap-3 mb-2">
//                 <Heart className="w-5 h-5" />
//                 <div>
//                   <p className="font-semibold">Wellness Status</p>
//                   <p className="text-sm opacity-75">{wellnessStatus.message}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </Card>

//       {/* Detailed Metrics */}
//       {currentEmotion && (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Stress Level */}
//           <Card className="p-4 bg-gradient-to-br from-white to-red-50/30">
//             <div className="flex items-center gap-3 mb-3">
//               <AlertCircle className="w-5 h-5 text-red-500" />
//               <span className="font-medium text-gray-800">Stress Level</span>
//             </div>
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Level</span>
//                 <span className="font-semibold">
//                   {Math.round(currentEmotion.wellnessIndicators.stressLevel * 100)}%
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div 
//                   className={`h-2 rounded-full transition-all duration-300 ${
//                     currentEmotion.wellnessIndicators.stressLevel > 0.7 ? 'bg-red-500' :
//                     currentEmotion.wellnessIndicators.stressLevel > 0.4 ? 'bg-yellow-500' :
//                     'bg-green-500'
//                   }`}
//                   style={{ width: `${currentEmotion.wellnessIndicators.stressLevel * 100}%` }}
//                 ></div>
//               </div>
//             </div>
//           </Card>

//           {/* Engagement Level */}
//           <Card className="p-4 bg-gradient-to-br from-white to-blue-50/30">
//             <div className="flex items-center gap-3 mb-3">
//               <Brain className="w-5 h-5 text-blue-500" />
//               <span className="font-medium text-gray-800">Engagement</span>
//             </div>
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Level</span>
//                 <span className="font-semibold">
//                   {Math.round(currentEmotion.wellnessIndicators.engagementLevel * 100)}%
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div 
//                   className="h-2 bg-blue-500 rounded-full transition-all duration-300"
//                   style={{ width: `${currentEmotion.wellnessIndicators.engagementLevel * 100}%` }}
//                 ></div>
//               </div>
//             </div>
//           </Card>

//           {/* Energy Level */}
//           <Card className="p-4 bg-gradient-to-br from-white to-green-50/30">
//             <div className="flex items-center gap-3 mb-3">
//               <Zap className="w-5 h-5 text-green-500" />
//               <span className="font-medium text-gray-800">Energy</span>
//             </div>
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Level</span>
//                 <span className="font-semibold">
//                   {Math.round((1 - currentEmotion.wellnessIndicators.fatigueLevel) * 100)}%
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div 
//                   className="h-2 bg-green-500 rounded-full transition-all duration-300"
//                   style={{ width: `${(1 - currentEmotion.wellnessIndicators.fatigueLevel) * 100}%` }}
//                 ></div>
//               </div>
//             </div>
//           </Card>
//         </div>
//       )}

//       {/* Emotion Breakdown */}
//       {currentEmotion && (
//         <Card className="p-4 bg-gradient-to-br from-white to-purple-50/30">
//           <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
//             <Eye className="w-4 h-4" />
//             Emotion Breakdown
//           </h4>
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//             {Object.entries(currentEmotion.emotions).map(([emotion, value]) => (
//               <div key={emotion} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm">{getEmotionIcon(emotion)}</span>
//                   <span className="text-sm font-medium capitalize">{emotion}</span>
//                 </div>
//                 <span className="text-sm font-semibold text-gray-600">
//                   {Math.round(value * 100)}%
//                 </span>
//               </div>
//             ))}
//           </div>
//         </Card>
//       )}

//       {/* Recent History */}
//       {emotionHistory.length > 0 && (
//         <Card className="p-4 bg-gradient-to-br from-white to-gray-50/30">
//           <h4 className="font-medium text-gray-800 mb-3">Recent Emotion History</h4>
//           <div className="space-y-2 max-h-32 overflow-y-auto">
//             {emotionHistory.slice(-5).reverse().map((entry, index) => (
//               <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-lg text-sm">
//                 <div className="flex items-center gap-2">
//                   <span>{getEmotionIcon(entry.emotion)}</span>
//                   <span className="font-medium capitalize">{entry.emotion}</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-xs text-gray-500">
//                   <span>{Math.round(entry.confidence * 100)}%</span>
//                   <span>{entry.timestamp.toLocaleTimeString()}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>
//       )}

//       {/* Hidden video element for camera access */}
//       <video
//         ref={videoRef}
//         style={{ display: 'none' }}
//         autoPlay
//         muted
//         playsInline
//       />
//       <canvas
//         ref={canvasRef}
//         style={{ display: 'none' }}
//       />
//     </div>
//   );
// };

// export default LiveEmotionDashboard;


// src/components/LiveEmotionDashboard.tsx (Simplified Example)

import React, { useState, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff, Sparkles, Activity } from 'lucide-react';
// *** IMPORT YOUR *REAL* SERVICE ***
import { emotionDetection, type EmotionDetectionResult } from '../services/emotionDetection';
import { toast } from 'sonner';

interface LiveEmotionDashboardProps {
  onEmotionUpdate?: (emotion: EmotionDetectionResult) => void;
  className?: string;
}

export const LiveEmotionDashboard: React.FC<LiveEmotionDashboardProps> = ({
  onEmotionUpdate,
  className = ""
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetectionResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // For snapshot
  
  const videoRef = useRef<HTMLVideoElement>(null); // *** This is now ESSENTIAL ***

  // ... (Keep your getEmotionIcon, getEmotionColor helpers) ...

  const handleEmotionUpdate = (result: EmotionDetectionResult) => {
    setCurrentEmotion(result);
    onEmotionUpdate?.(result);
  };

  const startDetection = useCallback(async () => {
    if (!videoRef.current) return; // Need the video element
    setIsInitializing(true);
    
    try {
      // *** PASS THE VIDEO ELEMENT TO THE SERVICE ***
      await emotionDetection.startRealTimeAnalysis(
        videoRef.current,
        handleEmotionUpdate,
        { interval: 1000 } // 1-second updates (fast!)
      );
      setIsActive(true);
      toast.success('Live detection started');
    } catch (error) {
      // --- FIX: Check the error type ---
      let errorMessage = 'Camera failed to start';
      if (error instanceof Error) {
        errorMessage = `Camera failed: ${error.message}`;
      }
      toast.error(errorMessage);
      // -----------------------------------
    }
    setIsInitializing(false);
  }, [onEmotionUpdate]);

  const stopDetection = useCallback(() => {
    emotionDetection.stopRealTimeAnalysis();
    setIsActive(false);
    setCurrentEmotion(null);
    toast.info('Live detection stopped');
  }, []);

  // *** NEW: On-Demand Snapshot Function ***
  const handleSnapshotAnalysis = async () => {
    if (!videoRef.current || !isActive) {
      toast.info('Please start the camera first.');
      return;
    }
    
    setIsAnalyzing(true);
    toast.info('Getting high-accuracy analysis...');
    
    try {
      const result = await emotionDetection.analyzeSnapshot(videoRef.current);
      // You can display this result separately
      toast.success(`Cloud Analysis: ${result.primaryEmotion} (${Math.round(result.confidence * 100)}%)`);
      // Or even update the main emotion
      handleEmotionUpdate(result);
    } catch (error) {
      // --- FIX: Check the error type ---
      let errorMessage = 'Snapshot analysis failed';
      if (error instanceof Error) {
        errorMessage = `Snapshot failed: ${error.message}`;
      }
      toast.error(errorMessage);
      // -----------------------------------
    }
    setIsAnalyzing(false);
  };

  // ... (useEffect for cleanup is still good) ...

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6 ...">
        <div className="flex items-center justify-between mb-4">
            {/* ... (Your Header) ... */}
            
            {/* --- MODIFIED BUTTONS --- */}
            <div className="flex gap-2">
                <Button
                    onClick={isActive ? stopDetection : startDetection}
                    disabled={isInitializing}
                    variant={isActive ? "destructive" : "default"}
                    className="rounded-xl"
                >
                    {isInitializing ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : (isActive ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />)}
                    {isActive ? 'Stop Camera' : 'Start Camera'}
                </Button>

                {/* --- NEW SNAPSHOT BUTTON --- */}
                <Button
                    onClick={handleSnapshotAnalysis}
                    disabled={!isActive || isAnalyzing}
                    variant="outline"
                    className="rounded-xl"
                >
                    {isAnalyzing ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Analyze Snapshot
                </Button>
            </div>
        </div>

        {/* --- VIDEO ELEMENT IS NOW CRITICAL --- */}
        <div className="relative bg-gray-100 rounded-xl ...">
            <video
                ref={videoRef} // This ref is passed to the service
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
            />
            {/* ... (Your "LIVE" and emotion overlays) ... */}
        </div>

        {/* ... (Rest of your dashboard UI for displaying metrics) ... */}
      </Card>
      
      {/* ... (Rest of your component) ... */}
    </div>
  );
};

export default LiveEmotionDashboard;