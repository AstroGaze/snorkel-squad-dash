export type AppRole = 'admin' | 'seller';

interface StoredUser {
  email: string;
  password: string;
  role: AppRole;
}

export interface AuthSession {
  email: string;
  role: AppRole;
}

interface SignUpPayload {
  email: string;
  password: string;
  role: AppRole;
}

const USERS_KEY = 'aquareservas::users';
const SESSION_KEY = 'aquareservas::session';

const DEFAULT_USERS: StoredUser[] = [
  { email: 'admin@aquareservas.com', password: 'admin123', role: 'admin' },
  { email: 'ventas@aquareservas.com', password: 'ventas123', role: 'seller' }
];

const hasWindow = typeof window !== 'undefined';
const hasStorage = hasWindow && typeof window.localStorage !== 'undefined';

let memoryUsers: StoredUser[] | null = null;
let memorySession: AuthSession | null = null;

const normaliseEmail = (value: string) => value.trim().toLowerCase();

const cloneUsers = (users: StoredUser[]) => users.map((user) => ({ ...user }));

const readUsers = (): StoredUser[] => {
  if (hasStorage) {
    try {
      const raw = window.localStorage.getItem(USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredUser[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cloneUsers(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored users', error);
    }
  }

  if (memoryUsers) {
    return cloneUsers(memoryUsers);
  }

  const seeded = cloneUsers(DEFAULT_USERS);
  memoryUsers = seeded;

  if (hasStorage) {
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    } catch (error) {
      console.warn('Failed to persist default users', error);
    }
  }

  return cloneUsers(seeded);
};

const writeUsers = (users: StoredUser[]) => {
  const snapshot = cloneUsers(users);
  memoryUsers = snapshot;

  if (hasStorage) {
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('Failed to persist users', error);
    }
  }
};

const readSession = (): AuthSession | null => {
  if (hasStorage) {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        if (parsed && typeof parsed.email === 'string' && (parsed.role === 'admin' || parsed.role === 'seller')) {
          return { email: parsed.email, role: parsed.role };
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored session', error);
    }
  }

  if (memorySession) {
    return { ...memorySession };
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

export const getCurrentSession = (): AuthSession | null => {
  return readSession();
};

export const signIn = async (email: string, password: string, expectedRole?: AppRole) => {
  const normalisedEmail = normaliseEmail(email);
  const users = readUsers();
  const user = users.find((candidate) => candidate.email === normalisedEmail);

  if (!user) {
    throw new Error('No existe una cuenta con ese correo.');
  }

  if (user.password !== password) {
    throw new Error('La contrasena es incorrecta.');
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new Error('El rol seleccionado no coincide con tu cuenta.');
  }

  const session: AuthSession = { email: user.email, role: user.role };
  writeSession(session);
  emitAuthChange();

  return session;
};

export const signUp = async ({ email, password, role }: SignUpPayload) => {
  const normalisedEmail = normaliseEmail(email);
  const users = readUsers();

  if (users.some((user) => user.email === normalisedEmail)) {
    throw new Error('Ya existe una cuenta con ese correo.');
  }

  const nextUsers = [...users, { email: normalisedEmail, password, role }];
  writeUsers(nextUsers);

  const session: AuthSession = { email: normalisedEmail, role };
  writeSession(session);
  emitAuthChange();

  return session;
};

export const signOut = async () => {
  writeSession(null);
  emitAuthChange();
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
