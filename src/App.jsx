import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PlayerProvider } from './context/PlayerContext';
import { AppRoutes } from './router/router';
import { OnboardingView } from './features/onboarding/OnboardingView';

function AppContent() {
  const { hasFolder, stats } = useApp();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active modals
  const [activeNoteRecording, setActiveNoteRecording] = useState(null);
  const [activeDeleteRecording, setActiveDeleteRecording] = useState(null);

  // If no folder configured and no recordings indexed yet, display onboarding
  const showOnboarding = (!hasFolder || stats.total_recordings === 0) && !onboardingDismissed;

  if (showOnboarding) {
    return <OnboardingView onComplete={() => setOnboardingDismissed(true)} />;
  }

  return (
    <AppRoutes
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onOpenNote={(rec) => setActiveNoteRecording(rec)}
      onOpenDelete={(rec) => setActiveDeleteRecording(rec)}
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
