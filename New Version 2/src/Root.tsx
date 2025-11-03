import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthFlow } from './components/auth/AuthFlow';
import AppRouter from './components/AppRouter';
import VantaBackground from './components/VantaBackground';

const AppGate = () => {
  const { loading, userProfile, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'
      }}>
        <div>Loading…</div>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthFlow onAuthSuccess={() => { /* AuthProvider will re-render */ }} />;
  }

  return (
    <AppRouter currentUser={userProfile} onLogout={signOut} />
  );
};

const Root = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VantaBackground variant="fixed" />
        <AppGate />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Root;