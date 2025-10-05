import { useEffect, useState } from 'react';
import {
  getCurrentSession,
  onAuthChange,
  refreshSession,
  signOut as signOutAction,
  type AppRole,
  type AuthSession,
} from '@/lib/auth';

type AuthState = {
  session: AuthSession | null;
  role: AppRole | null;
  loading: boolean;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({ session: null, role: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const stored = getCurrentSession();
    setState({ session: stored, role: stored?.role ?? null, loading: true });

    refreshSession()
      .catch((error) => {
        console.warn('No se pudo sincronizar la sesion al iniciar', error);
      })
      .finally(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });

    const unsubscribe = onAuthChange((session) => {
      if (!cancelled) {
        setState({ session, role: session?.role ?? null, loading: false });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await signOutAction();
  };

  return { ...state, signOut };
};
