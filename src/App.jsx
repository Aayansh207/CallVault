import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PlayerProvider } from './context/PlayerContext';
import { AppRoutes } from './router/router';
import { OnboardingView } from './features/onboarding/OnboardingView';

function AppContent() {
  const { hasFolder, stats } = useApp();
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem('callvault_onboarded') === 'true';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      localStorage.setItem('callvault_onboarded', 'true');
    } catch {
      // ignore storage errors
    }
  };

  // Only show onboarding if user has not chosen a folder AND hasn't dismissed it
  const showOnboarding = !hasFolder && !onboardingDismissed;

  if (showOnboarding) {
    return <OnboardingView onComplete={handleDismissOnboarding} />;
  }

  return (
    <AppRoutes
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
