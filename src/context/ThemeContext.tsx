import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('accentColor') || '';
  });

  // Tokens are channel triplets (see index.css); a hex here silently kills every
  // colour opacity modifier on primary.
  const hexToChannels = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  };

  const applyAccentColor = (color: string) => {
    const root = document.documentElement;
    if (!color) {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-contrast');
      return;
    }
    root.style.setProperty('--color-primary', hexToChannels(color));
    // Ensure high-contrast foreground text for light pastel accents
    root.style.setProperty('--color-primary-contrast', '15 23 42');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      root.classList.add('light-theme');
    }
    localStorage.setItem('theme', theme);
    applyAccentColor(accentColor);
  }, [theme, accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    if (color) {
      localStorage.setItem('accentColor', color);
    } else {
      localStorage.removeItem('accentColor');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
