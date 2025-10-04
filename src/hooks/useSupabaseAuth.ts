import { useEffect, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, getRoleFromUser, type AppRole } from '@/lib/supabaseClient';

type AuthState = {
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
};

const deriveRole = (session: Session | null): AppRole | null =>
  getRoleFromUser(session?.user);

export const useSupabaseAuth = () => {
  const [supabase] = useState<SupabaseClient>(() => getSupabaseClient());
  const [state, setState] = useState<AuthState>({ session: null, role: null, loading: true });

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.error('Error retrieving session', error);
        setState({ session: null, role: null, loading: false });
        return;
      }

      const session = data.session ?? null;
      setState({ session, role: deriveRole(session), loading: false });
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setState({ session, role: deriveRole(session), loading: false });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Failed to sign out', error);
      throw error;
    }
  };

  return { ...state, signOut };
};

