import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

export const getRoleFromMetadata = (
  metadata: Record<string, unknown> | null | undefined
): AppRole | null => {
  const role = metadata && typeof metadata.role === 'string' ? metadata.role : null;
  return role === 'admin' || role === 'seller' ? role : null;
};

