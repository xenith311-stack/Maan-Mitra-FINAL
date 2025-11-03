import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';
import AICompanion from './AICompanion';
import { EmotionWidget } from './EmotionWidget';
import { type EmotionDetectionResult } from '../services/emotionDetection';
import type { Screen, UserData } from '../types';

interface AICompanionWithEmotionProps {
  navigateTo?: (screen: Screen) => void;
  userData?: UserData;
}

export function AICompanionWithEmotion({ navigateTo, userData }: AICompanionWithEmotionProps = {}) {
  const [showEmotionWidget, setShowEmotionWidget] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionDetectionResult | null>(null);

  const handleEmotionUpdate = (emotion: EmotionDetectionResult) => {
    setCurrentEmotion(emotion);
    
    // You can add logic here to influence the AI conversation based on detected emotions
    console.log('Emotion detected in AI Companion:', emotion);
    
    // Example: Show different responses based on stress level
    if (emotion.wellnessIndicators.stressLevel > 0.8) {
      console.log('High stress detected - AI should provide calming responses');
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Emotion Widget Sidebar */}
      {showEmotionWidget && (
        <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Live Emotion Detection</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmotionWidget(false)}
                className="rounded-lg"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <EmotionWidget 
              onEmotionUpdate={handleEmotionUpdate}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Main AI Companion */}
      <div className="flex-1 relative">
        {/* Toggle Button */}
        <Button
          onClick={() => setShowEmotionWidget(!showEmotionWidget)}
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-lg"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showEmotionWidget ? 'Hide' : 'Show'} Emotion Detection
        </Button>

        {/* Emotion Status Bar (when widget is hidden) */}
        {!showEmotionWidget && currentEmotion && (
          <div className="absolute top-16 right-4 z-10">
            <Card className="p-3 bg-white/90 backdrop-blur-sm shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {currentEmotion.primaryEmotion === 'joy' ? '😊' :
                   currentEmotion.primaryEmotion === 'sorrow' ? '😢' :
                   currentEmotion.primaryEmotion === 'anger' ? '😠' :
                   currentEmotion.primaryEmotion === 'surprise' ? '😲' :
                   currentEmotion.primaryEmotion === 'fear' ? '😰' : '😐'}
                </span>
                <div>
                  <p className="text-sm font-medium capitalize">{currentEmotion.primaryEmotion}</p>
                  <p className="text-xs text-gray-500">
                    Stress: {Math.round(currentEmotion.wellnessIndicators.stressLevel * 100)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* AI Companion Component */}
        <AICompanion navigateTo={navigateTo} userData={userData} />
      </div>
    </div>
  );
}

export default AICompanionWithEmotion;