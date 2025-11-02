# 🎭 Live Emotion Detection - Quick Setup Guide

## ✅ What's Been Added

Your MannMitra platform now includes a complete live emotion detection system that captures video frames at 1 FPS and analyzes emotions using Google Cloud Vision API.

### 🆕 New Components

1. **LiveEmotionDashboard** - Full-featured emotion detection dashboard
2. **LiveEmotionPage** - Complete page with session management  
3. **EmotionWidget** - Compact widget for integration
4. **EmotionTestPage** - Test suite for verification
5. **AICompanionWithEmotion** - Enhanced AI companion with emotion detection

### 🔗 New Routes Added

- `/live-emotion` - Full live emotion detection page
- `/emotion-test` - Test and verification page

### 📱 Navigation Menu

New menu items added to your sidebar:
- **Live Emotion** (📹) - Access live detection
- **Emotion Test** (🧪) - Test system functionality

## 🚀 How to Use

### 1. Access Live Emotion Detection
1. Open your MannMitra app
2. Click "Live Emotion" in the sidebar menu
3. Grant camera permissions when prompted
4. Click "Start Detection"

### 2. Test the System
1. Go to "Emotion Test" in the sidebar
2. Click "Run Tests" to verify system compatibility
3. Test both dashboard and widget components
4. Try different facial expressions

### 3. Integration Options

#### Option A: Use the Standalone Page
```
Navigate to /live-emotion for the full experience
```

#### Option B: Add Widget to Existing Components
```typescript
import { EmotionWidget } from './EmotionWidget';

<EmotionWidget 
  onEmotionUpdate={(emotion) => {
    console.log('Detected:', emotion.primaryEmotion);
  }}
  compact={true}
/>
```

#### Option C: Enhanced AI Companion
```typescript
// Replace AICompanion with AICompanionWithEmotion in routes
import { AICompanionWithEmotion } from './AICompanionWithEmotion';
```

## 🎯 Features Available

### Real-time Analysis
- **Emotions**: Joy, sorrow, anger, surprise, fear, disgust
- **Confidence**: Accuracy percentage for each detection
- **Frequency**: 1-second intervals for live feedback

### Wellness Indicators
- **Stress Level**: 0-100% stress measurement
- **Engagement**: Focus and attention level
- **Energy**: Fatigue vs. alertness measurement

### Session Management
- **Auto-tracking**: Sessions start/stop automatically
- **History**: View past emotion sessions
- **Export**: Download session data as JSON
- **Firebase**: Auto-save to user profile (optional)

### Visual Feedback
- **Live Dashboard**: Real-time emotion display
- **Wellness Metrics**: Color-coded stress indicators
- **Emotion Breakdown**: Detailed emotion percentages
- **History Timeline**: Recent emotion changes
- **Alerts**: High stress notifications

## 🔧 Technical Details

### Data Flow
```
Camera → Frame Capture (1 FPS) → Cloud Function → Vision API → Frontend Display
```

### Privacy & Security
- ✅ Video processing is local (frames only sent to API)
- ✅ No video storage - only emotion data saved
- ✅ User-controlled start/stop
- ✅ Explicit camera permissions required

### Performance
- **Frame Rate**: 1 FPS (adjustable)
- **Analysis Speed**: ~1-2 seconds per frame
- **Memory Usage**: Minimal (no video buffering)
- **Network**: Only sends image frames to API

## 🛠️ Configuration

### Emotion Detection Settings
```typescript
// Adjust analysis frequency
interval: 1000, // milliseconds between analyses

// Cultural context for better accuracy
culturalContext: 'indian',

// Detection sensitivity (if supported)
sensitivity: 'medium'
```

### Firebase Integration
```typescript
// Auto-save sessions to user profile
const [autoSave, setAutoSave] = useState(true);

// Sessions saved to 'emotion_sessions' collection
// Includes: userId, sessionData, emotionData, timestamps
```

## 🔍 Testing & Verification

### System Tests
1. **Camera Availability** - Checks for camera devices
2. **Permissions** - Verifies camera access
3. **Service Status** - Emotion detection service
4. **Firebase** - Functions configuration
5. **Vision API** - Google Cloud setup

### Live Testing
1. **Dashboard Test** - Full emotion detection interface
2. **Widget Test** - Compact and full widget modes
3. **Emotion Accuracy** - Try different expressions
4. **Performance** - Monitor for errors/warnings

## 📊 Data Structure

### Emotion Result
```typescript
{
  faceDetected: boolean,
  emotions: {
    joy: 0.8,        // 80% confidence
    sorrow: 0.1,
    anger: 0.05,
    surprise: 0.02,
    fear: 0.02,
    disgust: 0.01
  },
  primaryEmotion: "joy",
  confidence: 0.8,
  wellnessIndicators: {
    stressLevel: 0.2,      // 20% stress
    engagementLevel: 0.9,  // 90% engaged
    fatigueLevel: 0.1      // 10% fatigue
  }
}
```

### Session Data
```typescript
{
  sessionId: "session_1234567890",
  startTime: Date,
  endTime: Date,
  duration: 300, // seconds
  totalFrames: 300,
  averageStress: 0.3,
  dominantEmotion: "joy",
  emotionData: [/* array of emotion results */]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try different browser

2. **No Emotions Detected**
   - Ensure good lighting
   - Face should be clearly visible
   - Check API key configuration

3. **High Latency**
   - Check internet connection
   - Monitor Cloud Function logs
   - Reduce analysis frequency

4. **Permission Denied**
   - Enable camera in browser settings
   - Check site permissions
   - Reload page and try again

### Debug Steps
1. Open browser console (F12)
2. Check for error messages
3. Verify camera permissions
4. Test with emotion test page
5. Monitor network requests

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Camera feed appears in dashboard
- ✅ Emotions update in real-time
- ✅ Wellness metrics show values
- ✅ No console errors
- ✅ Session data saves properly

## 📞 Support

If you encounter issues:
1. Run the system tests first (`/emotion-test`)
2. Check browser console for errors
3. Verify Firebase Functions are deployed
4. Ensure Google Cloud Vision API is configured
5. Test with different browsers/devices

---

**🎭 Your live emotion detection system is now ready to help users understand their emotional states in real-time!**