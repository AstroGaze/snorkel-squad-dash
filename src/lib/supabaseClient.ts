import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
};

export type AppRole = 'admin' | 'seller';
export const getRoleFromUser = (user: User | null | undefined): AppRole | null => {
  const candidate = typeof user?.app_metadata?.role === 'string' ? user.app_metadata.role
    : typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role
      : null;
  return candidate === 'admin' || candidate === 'seller' ? candidate : null;
};

