import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_THEME_KEY = 'quantum_lab_theme';
const STORAGE_PROFILE_KEY = 'quantum_lab_guest_profile';

const DEFAULT_PROFILE = {
  name: 'Guest Researcher',
  role: 'Student',
  institution: 'Local Guest Workspace',
  defaultLevel: 'beginner',
  defaultShots: 1024,
  defaultMode: 'ideal',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignore storage errors in restricted browsers
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateProfile = (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        profile,
        updateProfile,
        resetProfile,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
