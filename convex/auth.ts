import { mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { ensureSeedOperators } from './seeds';

type AppRole = 'admin' | 'seller';

type SessionResponse = {
  token: string;
  email: string;
  role: AppRole;
  expiresAt: number;
};

type SeedUser = {
  email: string;
  password: string;
  role: AppRole;
};

const DEFAULT_USERS: SeedUser[] = [
  { email: 'admin@aquareservas.com', password: 'admin123', role: 'admin' },
  { email: 'ventas@aquareservas.com', password: 'ventas123', role: 'seller' },
];

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const TOKEN_BYTES = 32;
const SALT_BYTES = 16;

const normaliseEmail = (value: string) => value.trim().toLowerCase();
const textEncoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer | Uint8Array) => {
  const view = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const randomHex = (byteLength: number) => {
  const array = new Uint8Array(byteLength);
  if (typeof crypto === 'undefined') {
    throw new Error('Crypto API is not available.');
  }
  crypto.getRandomValues(array);
  return toHex(array);
};

const digest = async (input: string) => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Crypto API is not available.');
  }
  const data = textEncoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return toHex(hashBuffer);
};

const safeEquals = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
};

const hashPassword = async (password: string) => {
  const salt = randomHex(SALT_BYTES);
  const hash = await digest(`${salt}:${password}`);
  return `${salt}:${hash}`;
};

const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = await digest(`${salt}:${password}`);
  return safeEquals(hash, candidate);
};

const ensureSeedUsers = async (ctx: MutationCtx) => {
  for (const preset of DEFAULT_USERS) {
    const email = normaliseEmail(preset.email);

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (!existing) {
      const now = Date.now();
      await ctx.db.insert('users', {
        email,
        passwordHash: await hashPassword(preset.password),
        role: preset.role,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
};

const cleanupExpiredSessions = async (ctx: MutationCtx, userId: Id<'users'>) => {
  const now = Date.now();
  const sessions = await ctx.db
    .query('sessions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  await Promise.all(
    sessions.map(async (session) => {
      if (session.expiresAt && session.expiresAt <= now) {
        await ctx.db.delete(session._id);
      }
    }),
  );
};

type SessionRecord = {
  token: string;
  expiresAt: number;
};

const createSession = async (ctx: MutationCtx, userId: Id<'users'>): Promise<SessionRecord> => {
  const token = randomHex(TOKEN_BYTES);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await ctx.db.insert('sessions', {
    userId,
    token,
    createdAt: now,
    expiresAt,
  });

  return { token, expiresAt };
};

const getSessionByToken = (ctx: QueryCtx | MutationCtx, token: string) =>
  ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', token))
    .unique();

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal('admin'), v.literal('seller')),
  },
  handler: async (ctx, args) => {
    await ensureSeedUsers(ctx);
    await ensureSeedOperators(ctx);

    const email = normaliseEmail(args.email);

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (existing) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      email,
      passwordHash,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });

    const session = await createSession(ctx, userId);

    return {
      token: session.token,
      email,
      role: args.role,
      expiresAt: session.expiresAt,
    } satisfies SessionResponse;
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    expectedRole: v.optional(v.union(v.literal('admin'), v.literal('seller'))),
  },
  handler: async (ctx, args) => {
    await ensureSeedUsers(ctx);
    await ensureSeedOperators(ctx);

    const email = normaliseEmail(args.email);

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (!user) {
      throw new Error('No existe una cuenta con ese correo.');
    }

    const isMatch = await verifyPassword(args.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('La contrasena es incorrecta.');
    }

    if (args.expectedRole && user.role !== args.expectedRole) {
      throw new Error('El rol seleccionado no coincide con tu cuenta.');
    }

    await cleanupExpiredSessions(ctx, user._id);
    const session = await createSession(ctx, user._id);

    return {
      token: session.token,
      email: user.email,
      role: user.role,
      expiresAt: session.expiresAt,
    } satisfies SessionResponse;
  },
});

export const signOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.token);
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const getSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.token);

    if (!session) {
      return null;
    }

    const now = Date.now();
    if (session.expiresAt && session.expiresAt <= now) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      email: user.email,
      role: user.role,
      expiresAt: session.expiresAt ?? now + SESSION_TTL_MS,
    } satisfies Omit<SessionResponse, 'token'>;
  },
});
