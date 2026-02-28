'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
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
    try {
      const saved = localStorage.getItem('ws-theme') as Theme | null;
      if (saved) {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {}
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('ws-theme', t); } catch {}
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, setTheme, mounted }),
    [theme, setTheme, mounted]
  );

  return (
    <Ctx.Provider value={value}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}