import { api } from '../../convex/_generated/api';
import { getConvexHttpClient } from './convexClient';

export type AppRole = 'admin' | 'seller';

export interface AuthSession {
  token: string;
  email: string;
  role: AppRole;
  expiresAt: number;
}

interface SignUpPayload {
  email: string;
  password: string;
  role: AppRole;
}

const SESSION_KEY = 'aquareservas::session';

const hasWindow = typeof window !== 'undefined';
const hasStorage = hasWindow && typeof window.localStorage !== 'undefined';

let memorySession: AuthSession | null = null;

const readSession = (): AuthSession | null => {
  if (memorySession) {
    return { ...memorySession };
  }

  if (!hasStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      parsed &&
      typeof parsed.token === 'string' &&
      typeof parsed.email === 'string' &&
      (parsed.role === 'admin' || parsed.role === 'seller') &&
      typeof parsed.expiresAt === 'number'
    ) {
      const session: AuthSession = {
        token: parsed.token,
        email: parsed.email,
        role: parsed.role,
        expiresAt: parsed.expiresAt,
      };
      memorySession = { ...session };
      return { ...session };
    }
  } catch (error) {
    console.warn('Failed to parse stored session', error);
  }

  return null;
};

const writeSession = (session: AuthSession | null) => {
  memorySession = session ? { ...session } : null;

  if (hasStorage) {
    try {
      if (session) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist session', error);
    }
  }
};

const authEvents = hasWindow ? new EventTarget() : null;

const emitAuthChange = () => {
  authEvents?.dispatchEvent(new Event('change'));
};

const persistAndBroadcast = (session: AuthSession | null) => {
  writeSession(session);
  emitAuthChange();
};

export const getCurrentSession = (): AuthSession | null => {
  return readSession();
};

export const refreshSession = async (): Promise<AuthSession | null> => {
  const stored = readSession();
  if (!stored) {
    return null;
  }

  try {
    const client = getConvexHttpClient();
    const next = await client.query(api.auth.getSession, { token: stored.token });

    if (!next) {
      persistAndBroadcast(null);
      return null;
    }

    const hydrated: AuthSession = {
      token: stored.token,
      email: next.email,
      role: next.role,
      expiresAt: next.expiresAt,
    };

    persistAndBroadcast(hydrated);
    return hydrated;
  } catch (error) {
    console.warn('Fallo al refrescar la sesion', error);
    return stored;
  }
};

export const signIn = async (email: string, password: string, expectedRole?: AppRole) => {
  const client = getConvexHttpClient();

  const session = await client.mutation(api.auth.signIn, {
    email,
    password,
    expectedRole,
  });

  const typedSession: AuthSession = {
    token: session.token,
    email: session.email,
    role: session.role,
    expiresAt: session.expiresAt,
  };

  persistAndBroadcast(typedSession);
  return typedSession;
};

export const signUp = async ({ email, password, role }: SignUpPayload) => {
  const client = getConvexHttpClient();
  const session = await client.mutation(api.auth.signUp, {
    email,
    password,
    role,
  });

  const typedSession: AuthSession = {
    token: session.token,
    email: session.email,
    role: session.role,
    expiresAt: session.expiresAt,
  };

  persistAndBroadcast(typedSession);
  return typedSession;
};

export const signOut = async () => {
  const session = readSession();

  try {
    if (session) {
      const client = getConvexHttpClient();
      await client.mutation(api.auth.signOut, { token: session.token });
    }
  } catch (error) {
    console.warn('Fallo al cerrar sesion remoto', error);
  } finally {
    persistAndBroadcast(null);
  }
};

export const onAuthChange = (listener: (session: AuthSession | null) => void) => {
  if (!authEvents) {
    return () => {};
  }

  const handler = () => listener(getCurrentSession());
  authEvents.addEventListener('change', handler);

  return () => {
    authEvents.removeEventListener('change', handler);
  };
};


