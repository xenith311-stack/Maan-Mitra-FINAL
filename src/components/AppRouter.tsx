import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import components

import HomePage from './HomePage';
import AICompanion from './AICompanion';
import Journal from './Journal';
import PostQuizHome from './PostQuizHome';
import { AdvancedDashboard } from './AdvancedDashboard';
import VoiceTherapy from './VoiceTherapy';
import EmotionDetection from './EmotionDetection';
// import { Dashboard } from './Dashboard';
import Chatbot from './Chatbot';
import { QuizPage } from './QuizPage';
import { CalmDownSession } from './CalmDownSession';
import { AdminDashboard } from './admin/AdminDashboard';
import { FirebaseSetup } from './setup/FirebaseSetup';
import { QuickNav } from './admin/QuickNav';
import { LaunchChecklist } from './launch/LaunchChecklist';
import { LaunchInstructions } from './launch/LaunchInstructions';
import { SimpleChecklist } from './launch/SimpleChecklist';
import { DiagnosticTool } from './DiagnosticTool';
import { IndexTestTool } from './IndexTestTool';

// Import services
import { voiceAnalysis } from '../services/voiceAnalysis';
import { emotionDetection } from '../services/emotionDetection';
import { useAuth } from './auth/AuthProvider';
import { UserProfile } from '../services/firebaseService';

interface AppRouterProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ currentUser, onLogout }) => {
  const [systemStatus, setSystemStatus] = useState({
    aiOrchestrator: false,
    voiceAnalysis: false,
    emotionDetection: false,
    sessionManager: false
  });

  const { signOut } = useAuth();

  useEffect(() => {
    // Check system status with a slight delay to ensure services are initialized
    const checkSystemStatus = () => {
      const status = {
        aiOrchestrator: true, // AI Orchestrator is always available
        voiceAnalysis: voiceAnalysis.isServiceAvailable(),
        emotionDetection: emotionDetection.isServiceAvailable(),
        sessionManager: true // Session manager is always available
      };
      
      console.log('System Status Check:', status);
      setSystemStatus(status);
    };

    // Check immediately
    checkSystemStatus();
    
    // Also check after a short delay to ensure services are fully initialized
    const timer = setTimeout(checkSystemStatus, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Router>
      <div className="flex h-screen">
        <NavigationSidebar currentUser={currentUser} onLogout={handleLogout} systemStatus={systemStatus} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/dashboard" element={<AdvancedDashboard userId={currentUser.uid} navigateTo={(screen) => navigate(`/${screen === 'ai-companion' ? 'companion' : screen === 'calm-down' ? 'voice' : screen}`)} />} />
            <Route path="/companion" element={<AICompanion userData={currentUser as any} />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/analytics" element={<AdvancedAnalytics userId={currentUser.uid} />} />
            <Route path="/voice" element={<VoiceTherapy />} />
            <Route path="/emotion" element={<EmotionDetection />} />
            <Route path="/settings" element={<SettingsPanel user={currentUser} onUpdate={() => {}} />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/setup" element={<FirebaseSetup />} />
            <Route path="/launch-check" element={<LaunchChecklist />} />
            <Route path="/launch-ready" element={<SimpleChecklist />} />
            <Route path="/launch-guide" element={<LaunchInstructions />} />
            <Route path="/diagnostic" element={<DiagnosticTool />} />
            <Route path="/index-test" element={<IndexTestTool />} />
            <Route path="/chatbot" element={<Chatbot navigateTo={() => {}} />} />
            <Route path="/quiz" element={<QuizRouteWrapper />} />
            <Route path="/calm-down" element={<CalmDownRouteWrapper />} />
            <Route path="/post-quiz-home" element={<PostQuizHomeWrapper />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
};

// Navigation Sidebar Component
const NavigationSidebar: React.FC<{
  currentUser: UserProfile;
  onLogout: () => void;
  systemStatus: any;
}> = ({ currentUser, onLogout, systemStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: 'BarChart3', label: 'Dashboard', route: '/dashboard', premium: false },
    { icon: 'MessageCircle', label: 'AI Companion', route: '/companion', premium: false },
    { icon: 'BookOpen', label: 'Journal', route: '/journal', premium: false },
    { icon: 'Home', label: 'Home', route: '/home', premium: false },
    { icon: 'Brain', label: 'Advanced Analytics', route: '/analytics', premium: false },
    { icon: 'Mic', label: 'Voice Therapy', route: '/voice', premium: false },
    { icon: 'Camera', label: 'Emotion Detection', route: '/emotion', premium: false },
    { icon: 'Settings', label: 'Settings', route: '/settings', premium: false }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">❤️</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">MannMitra</h1>
            <p className="text-xs text-gray-500">AI Mental Health Companion</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      {currentUser && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">👤</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.displayName}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="p-4 border-b">
        <h3 className="text-xs font-medium text-gray-500 mb-2">SYSTEM STATUS</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">AI Services</span>
            <span className={`text-xs px-2 py-1 rounded ${systemStatus.aiOrchestrator ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {systemStatus.aiOrchestrator ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Voice Analysis</span>
            <span className={`text-xs px-2 py-1 rounded ${systemStatus.voiceAnalysis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {systemStatus.voiceAnalysis ? 'Ready' : 'Unavailable'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Emotion Detection</span>
            <span className={`text-xs px-2 py-1 rounded ${systemStatus.emotionDetection ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {systemStatus.emotionDetection ? 'Ready' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.route}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                location.pathname === item.route 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100 text-gray-700'
              } ${(item.route === '/voice' || item.route === '/emotion') ? 'border-2 border-red-200' : ''}`}
              style={{ 
                pointerEvents: 'auto', 
                zIndex: 1,
                position: 'relative',
                display: 'block',
                minHeight: '40px'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked! Navigating to:', item.route, 'Label:', item.label);
                
                // Special handling for voice and emotion buttons
                if (item.route === '/voice') {
                  console.log('🎤 Voice Therapy button clicked!');
                  alert('Voice Therapy button clicked! Navigating to voice therapy...');
                } else if (item.route === '/emotion') {
                  console.log('📷 Emotion Detection button clicked!');
                  alert('Emotion Detection button clicked! Navigating to emotion detection...');
                }
                
                // Add visual feedback
                e.currentTarget.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  e.currentTarget.style.transform = 'scale(1)';
                }, 100);
                
                navigate(item.route);
              }}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{getIcon(item.icon)}</span>
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <button 
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

// Helper function to get icons
const getIcon = (iconName: string): string => {
  const icons: { [key: string]: string } = {
    BarChart3: '📊',
    MessageCircle: '💬',
    BookOpen: '📖',
    Home: '🏠',
    Brain: '🧠',
    Mic: '🎤',
    Camera: '📷',
    Settings: '⚙️'
  };
  return icons[iconName] || '📄';
};

// Advanced Analytics Component
const AdvancedAnalytics: React.FC<{ userId: string }> = () => {
  const navigate = useNavigate();
  return (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow p-6 border border-emerald-300/60" style={{ backgroundColor: '#ffffff' }}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📈</span>
        Advanced Analytics (Premium Feature)
      </h2>
      <p className="text-gray-600 mb-4">
        Get detailed insights into your mental health journey with advanced AI analytics.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow transition-shadow border-emerald-300/60 cursor-pointer" style={{ backgroundColor: '#ffffff' }} onClick={() => navigate('/dashboard')}>
          <h4 className="font-medium mb-2">Predictive Insights</h4>
          <p className="text-sm text-gray-600">
            AI-powered predictions about your emotional patterns and potential triggers.
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow transition-shadow border-emerald-300/60 cursor-pointer" style={{ backgroundColor: '#ffffff' }} onClick={() => navigate('/dashboard')}>
          <h4 className="font-medium mb-2">Personalized Recommendations</h4>
          <p className="text-sm text-gray-600">
            Customized therapeutic interventions based on your unique profile.
          </p>
        </div>
      </div>
    </div>
  </div>
);
};



// Settings Panel
const SettingsPanel: React.FC<{ user: any; onUpdate: (user: any) => void }> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  return (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow p-6 border border-emerald-300/60" style={{ backgroundColor: '#ffffff' }}>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm border-emerald-300/60">
          <label className="block text-sm font-medium mb-2">Language Preference</label>
          <select 
            className="w-full p-2 border rounded-md bg-white border-emerald-300/60"
            value={user.preferences.language}
            onChange={(e) => {
              const updatedUser = {
                ...user,
                preferences: {
                  ...user.preferences,
                  language: e.target.value as 'hindi' | 'english' | 'mixed'
                }
              };
              onUpdate(updatedUser);
              localStorage.setItem('mannmitra_user', JSON.stringify(updatedUser));
            }}
          >
            <option value="mixed">Hindi + English (Mixed)</option>
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
        </div>
        
        <div className="p-4 border rounded-lg bg-white shadow-sm border-emerald-300/60">
          <label className="block text-sm font-medium mb-2">Communication Style</label>
          <select 
            className="w-full p-2 border rounded-md bg-white border-emerald-300/60"
            value={user.preferences.communicationStyle}
            onChange={(e) => {
              const updatedUser = {
                ...user,
                preferences: {
                  ...user.preferences,
                  communicationStyle: e.target.value as 'formal' | 'casual'
                }
              };
              onUpdate(updatedUser);
              localStorage.setItem('mannmitra_user', JSON.stringify(updatedUser));
            }}
          >
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
          </select>
        </div>
        <div className="pt-2">
          <button className="w-full px-4 py-2 rounded-md transition-shadow bg-white text-gray-900 border border-emerald-300/60 shadow-sm hover:shadow" onClick={() => navigate('/dashboard')}>
            Save and Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default AppRouter;
 
// ----- Route Wrappers to adapt existing components to react-router -----

const QuizRouteWrapper: React.FC = () => {
  const navigate = useNavigate();
  const defaultUserData = {
    onboardingCompleted: true,
    preferences: undefined,
    quizCompleted: false,
    currentQuizQuestion: 0,
    quizAnswers: Array(5).fill(0),
    overallScore: 0,
    metrics: { stress: 0, sleep: 0, happiness: 0, productivity: 0, activity: 0, phq9: 0, gad7: 0 },
    streaks: { current: 0, longest: 0 },
    milestones: []
  };

  const [userData, setUserData] = React.useState(() => {
    const saved = localStorage.getItem('quiz_user_data');
    return saved ? JSON.parse(saved) : defaultUserData;
  });

  const updateUserData = (data: Partial<typeof userData>) => {
    const updated = { ...userData, ...data };
    setUserData(updated);
    localStorage.setItem('quiz_user_data', JSON.stringify(updated));
  };

  const navigateTo = (screen: string) => {
    switch (screen) {
      case 'post-quiz-home':
        navigate('/post-quiz-home');
        break;
      case 'home':
        navigate('/home');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <QuizPage
      navigateTo={navigateTo as any}
      userData={userData}
      updateUserData={updateUserData}
    />
  );
};

const CalmDownRouteWrapper: React.FC = () => {
  const navigate = useNavigate();
  const navigateTo = (screen: string) => {
    switch (screen) {
      case 'home':
        navigate('/home');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      default:
        navigate('/');
    }
  };
  return <CalmDownSession navigateTo={navigateTo as any} />;
};

const PostQuizHomeWrapper: React.FC = () => {
  const navigate = useNavigate();
  const saved = localStorage.getItem('quiz_user_data');
  const userData = saved ? JSON.parse(saved) : undefined;

  const navigateTo = (screen: string) => {
    switch (screen) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'quiz':
        navigate('/quiz');
        break;
      case 'stats':
        navigate('/analytics');
        break;
      case 'ai-companion':
        navigate('/companion');
        break;
      case 'calm-down':
        navigate('/calm-down');
        break;
      case 'journal':
        navigate('/journal');
        break;
      default:
        navigate('/');
    }
  };

  if (!userData) {
    return <Navigate to="/quiz" replace />;
  }

  return <PostQuizHome navigateTo={navigateTo as any} userData={userData} />;
};
