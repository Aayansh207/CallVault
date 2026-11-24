import { useEffect, useState, useTransition } from 'react';
import { api } from '../lib/ipc';
import { useApp } from '../context/AppContext';

export function useRecordings(options) {
  const { refreshTrigger } = useApp();
  const [result, setResult] = useState(null);
  const [isRendering, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    api.recordings.list(options).then(
      (recordings) => {
        if (active) startTransition(() => {
          setResult({ options, refreshTrigger, recordings: recordings || [] });
        });
      },
      () => {
        if (active) setResult((previous) => ({
          options, refreshTrigger, recordings: previous?.recordings || [], error: true,
        }));
      },
    );
    return () => { active = false; };
  }, [options, refreshTrigger]);

  return {
    recordings: result?.recordings || EMPTY,
    loading: result === null,
    updating: isRendering || result?.options !== options || result?.refreshTrigger !== refreshTrigger,
    error: result?.error,
  };
}

const EMPTY = [];
