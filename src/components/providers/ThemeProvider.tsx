'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'sepia' | 'amoled';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  mounted: boolean;
}

const defaultCtx: ThemeCtx = {
  theme: 'light',
  setTheme: () => {},
  mounted: false,
};

const Ctx = createContext<ThemeCtx>(defaultCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ws-theme') as Theme | null;
    if (saved) {
      applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    }
    setMounted(true);
  }, []);

  function applyTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('ws-theme', t);
  }

  return (
    <Ctx.Provider value={{ theme, setTheme: applyTheme, mounted }}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}