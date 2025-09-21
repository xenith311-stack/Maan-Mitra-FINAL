import { useState, useEffect } from 'react';
import AppRouter from './components/AppRouter';
import OnboardingFlow from './components/OnboardingFlow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { WorkingAuthForm } from './components/auth/WorkingAuthForm';
import { LoadingScreen } from './components/LoadingScreen';
import { validateEnvironmentVariables } from './utils/validation';
import VantaBackground from './components/VantaBackground';
import { Toaster } from 'sonner';

// Main App Component wrapped with Auth
function AppContent() {
  const { currentUser, userProfile, loading } = useAuth();
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Validate environment variables
      const envValidation = validateEnvironmentVariables();
      if (!envValidation.isValid) {
        setConfigErrors(envValidation.errors);
        console.warn('Environment configuration issues:', envValidation.errors);
      }
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  // Show loading screen while Firebase initializes
  if (loading) {
    return (
      <ErrorBoundary>
        <LoadingScreen 
          message="MannMitra" 
          submessage={configErrors.length > 0 
            ? "Configuration issues detected. Some features may not work properly."
            : "Initializing AI Mental Health Companion..."
          } 
        />
        <Toaster position="top-right" />
      </ErrorBoundary>
    );
  }

  // Show authentication flow if no user is logged in
  if (!currentUser || showAuth) {
    return (
      <ErrorBoundary>
        <WorkingAuthForm onSuccess={handleAuthSuccess} />
        <Toaster position="top-right" />
      </ErrorBoundary>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!userProfile?.onboardingComplete) {
    return (
      <ErrorBoundary>
        <VantaBackground />
        <OnboardingFlow 
          onComplete={async () => {
            // This will be handled by the updated OnboardingFlow component
          }} 
        />
        <Toaster position="top-right" />
      </ErrorBoundary>
    );
  }

  // Show main app
  return (
    <ErrorBoundary>
      <VantaBackground />
      <AppRouter 
        currentUser={userProfile} 
        onLogout={() => setShowAuth(true)} 
      />
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

// Main App with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}