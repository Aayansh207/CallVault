import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);
const storageKey = 'callvault_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  });

  useLayoutEffect(() => {
    const system = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (system.matches ? 'dark' : 'light') : theme;
    };
    apply();
    localStorage.setItem(storageKey, theme);
    system.addEventListener('change', apply);
    return () => system.removeEventListener('change', apply);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
