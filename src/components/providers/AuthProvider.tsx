'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/database';

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  mode: 'reader' | 'writer';
  setMode: (m: 'reader' | 'writer') => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<string | null>;
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

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    },
    [supabase]
  );

  useEffect(() => {
    const saved = localStorage.getItem('ws-mode');
    if (saved === 'writer') setModeState('writer');

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  function setMode(m: 'reader' | 'writer') {
    setModeState(m);
    localStorage.setItem('ws-mode', m);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, username: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    return error?.message ?? null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function signInWithProvider(provider: 'google' | 'github') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        session,
        loading,
        mode,
        setMode,
        signIn,
        signUp,
        signOut,
        signInWithProvider,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}