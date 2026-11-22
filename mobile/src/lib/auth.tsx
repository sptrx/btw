import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Me } from '@/lib/types';

type AuthState = {
  /** False until the stored session has been read. */
  ready: boolean;
  session: Session | null;
  me: Me | null;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState<{ userId: string; me: Me | null } | null>(null);
  const userId = session?.user.id ?? null;
  const me = userId && loaded?.userId === userId ? loaded.me : null;

  const fetchMe = useCallback(
    (forUser: string) =>
      api<Me>('me').then(
        (result) => ({ userId: forUser, me: result }),
        () => ({ userId: forUser, me: null })
      ),
    []
  );

  const refreshMe = useCallback(async () => {
    if (userId) setLoaded(await fetchMe(userId));
  }, [userId, fetchMe]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMe(userId).then((next) => {
      if (!cancelled) setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, fetchMe]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ ready, session, me, refreshMe, signOut }),
    [ready, session, me, refreshMe, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
