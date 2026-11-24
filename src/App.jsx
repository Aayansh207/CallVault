import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PlayerProvider } from './context/PlayerContext';
import { AppRoutes } from './router/router';
import { OnboardingView } from './features/onboarding/OnboardingView';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {

  const { hasFolder, settingsReady } = useApp();
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

  if (!settingsReady) return null;

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
    <ErrorBoundary>
      <ThemeProvider>
        <HashRouter>
          <AppProvider>
            <PlayerProvider>
              <AppContent />
            </PlayerProvider>
          </AppProvider>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

