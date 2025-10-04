import { useEffect, useState } from 'react';
import {
  getCurrentSession,
  onAuthChange,
  signOut as signOutAction,
  type AppRole,
  type AuthSession
} from '@/lib/auth';

type AuthState = {
  session: AuthSession | null;
  role: AppRole | null;
  loading: boolean;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({ session: null, role: null, loading: true });

  useEffect(() => {
    const initialSession = getCurrentSession();
    setState({ session: initialSession, role: initialSession?.role ?? null, loading: false });

    const unsubscribe = onAuthChange((session) => {
      setState({ session, role: session?.role ?? null, loading: false });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await signOutAction();
  };

  return { ...state, signOut };
};
