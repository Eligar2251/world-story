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
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/database';

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  mode: 'reader' | 'writer';
  setMode: (m: 'reader' | 'writer') => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
}

const defaultCtx: AuthCtx = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  mode: 'reader',
  setMode: () => {},
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  signInWithProvider: async () => {},
};

const Ctx = createContext<AuthCtx>(defaultCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setModeState] = useState<'reader' | 'writer'>('reader');

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    },
    [supabase]
  );

  useEffect(() => {
  try {
    const saved = localStorage.getItem('ws-mode');
    if (saved === 'writer') setModeState('writer');
  } catch {
    // localStorage недоступен
  }

  // Начальная проверка сессии
  async function initSession() {
    const response = await supabase.auth.getSession();
    const currentSession = response.data?.session ?? null;
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      await fetchProfile(currentSession.user.id);
    }
    setLoading(false);
  }

  initSession();

  // Подписка на изменения auth
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, [supabase, fetchProfile]);

  const setMode = useCallback((m: 'reader' | 'writer') => {
    setModeState(m);
    try {
      localStorage.setItem('ws-mode', m);
    } catch {
      // localStorage недоступен
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: username } },
      });
      return error?.message ?? null;
    },
    [supabase]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'github') => {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    [supabase]
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      profile,
      session,
      loading,
      mode,
      setMode,
      signIn,
      signUp,
      signOut: handleSignOut,
      signInWithProvider,
    }),
    [user, profile, session, loading, mode, setMode, signIn, signUp, handleSignOut, signInWithProvider]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}