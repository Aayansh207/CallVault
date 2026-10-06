import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/ipc';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({
    total_recordings: 0,
    total_duration_seconds: 0,
    total_people: 0,
    total_favorites: 0,
    total_file_size: 0,
    total_available: 0,
  });
  const [tags, setTags] = useState([]);
  const [scanningState, setScanningState] = useState({
    isScanning: false,
    phase: 'idle', // 'idle' | 'discovering' | 'indexing' | 'complete' | 'error'
    scanned: 0,
    total: 0,
    currentFile: '',
    newFiles: 0,
    modifiedFiles: 0,
    skippedFiles: 0,
    missingFiles: 0,
  });
  const [selectedTag, setSelectedTag] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.recordings.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await api.settings.get();
      if (s) setSettings(s);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const t = await api.recordings.getTags();
      if (t) setTags(t);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchStats();
    fetchTags();
  }, [fetchSettings, fetchStats, fetchTags, refreshTrigger]);

  // Wire scanner events
  useEffect(() => {
    const unsubProgress = api.scanner.onProgress((data) => {
      setScanningState((prev) => ({
        ...prev,
        isScanning: true,
        phase: data.phase || 'indexing',
        scanned: data.scanned || 0,
        total: data.total || 0,
        currentFile: data.currentFile || '',
        newFiles: data.newFiles || 0,
        modifiedFiles: data.modifiedFiles || 0,
        skippedFiles: data.skippedFiles || 0,
        missingFiles: data.missingFiles || 0,
      }));
    });

    const unsubComplete = api.scanner.onComplete((data) => {
      setScanningState({
        isScanning: false,
        phase: 'complete',
        scanned: data.scanned || 0,
        total: data.total || 0,
        currentFile: '',
        newFiles: data.newFiles || 0,
        modifiedFiles: data.modifiedFiles || 0,
        skippedFiles: data.skippedFiles || 0,
        missingFiles: data.missingFiles || 0,
      });
      fetchStats();
      refreshData();
    });

    const unsubError = api.scanner.onError((err) => {
      setScanningState((prev) => ({
        ...prev,
        isScanning: false,
        phase: 'error',
      }));
    });

    const unsubFileChange = api.scanner.onFileChange(() => {
      fetchStats();
      refreshData();
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
      unsubFileChange();
    };
  }, [fetchStats, refreshData]);

  const startScan = async (folder = null, options = {}) => {
    setScanningState({
      isScanning: true,
      phase: 'discovering',
      scanned: 0,
      total: 0,
      currentFile: 'Starting scan...',
      newFiles: 0,
      modifiedFiles: 0,
      skippedFiles: 0,
      missingFiles: 0,
    });
    try {
      const result = await api.scanner.scan(folder, options);
      fetchStats();
      refreshData();
      return result;
    } catch (err) {
      setScanningState((prev) => ({ ...prev, isScanning: false, phase: 'error' }));
      throw err;
    }
  };

  const cancelScan = async () => {
    await api.scanner.cancel();
  };

  const updateSetting = async (key, val) => {
    const updated = await api.settings.update(key, val);
    setSettings(updated);
  };

  const hasFolder = Boolean(settings.recording_folder);

  const value = {
    settings,
    stats,
    tags,
    selectedTag,
    setSelectedTag,
    scanningState,
    setScanningState,
    hasFolder,
    refreshTrigger,
    refreshData,
    fetchStats,
    fetchTags,
    fetchSettings,
    startScan,
    cancelScan,
    updateSetting,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
