import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

type AllowedRole = 'admin' | 'seller';

type Payload = {
  role?: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the set-role function.');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return new Response('Missing bearer token', { status: 401 });
  }

  const { data: userResult, error: getUserError } = await adminClient.auth.getUser(token);

  if (getUserError || !userResult?.user) {
    const message = getUserError?.message ?? 'Unable to resolve authenticated user.';
    return new Response(message, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch (parseError) {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const requestedRole = (payload.role ?? '').trim();

  if (!['admin', 'seller'].includes(requestedRole)) {
    return new Response('Invalid role provided', { status: 422 });
  }

  const role = requestedRole as AllowedRole;

  const currentAppMetadata = { ...(userResult.user.app_metadata ?? {}) } as Record<string, unknown>;
  const currentUserMetadata = { ...(userResult.user.user_metadata ?? {}) } as Record<string, unknown>;
  delete currentUserMetadata.role;

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userResult.user.id, {
    app_metadata: {
      ...currentAppMetadata,
      role,
    },
    user_metadata: currentUserMetadata,
  });

  if (updateError) {
    return new Response(updateError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ role }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});


