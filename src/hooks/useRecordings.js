import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/ipc';
import { useApp } from '../context/AppContext';

export function useRecordings(initialOptions = {}) {
  const { refreshTrigger } = useApp();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(initialOptions);

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.recordings.list(options);
      setRecordings(data || []);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings, refreshTrigger]);

  return {
    recordings,
    loading,
    options,
    setOptions,
    refetch: fetchRecordings,
  };
}

export default useRecordings;
