import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal('admin'), v.literal('seller')),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_email', ['email'])
    .index('by_role', ['role']),
  sessions: defineTable({
    userId: v.id('users'),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId']),
  operators: defineTable({
    nombre: v.string(),
    contacto: v.object({
      telefono: v.string(),
      email: v.string(),
      direccion: v.string(),
    }),
    botes: v.array(
      v.object({
        nombre: v.string(),
        capacidad: v.number(),
        estado: v.string(),
        tipo: v.string(),
      }),
    ),
    personal: v.number(),
    capacidadTotal: v.number(),
    horarios: v.array(v.string()),
    especialidad: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_nombre', ['nombre']),
  reservations: defineTable({
    operadorId: v.id('operators'),
    personas: v.number(),
    tipo: v.optional(v.string()),
    timestamp: v.string(),
    horaSalida: v.optional(v.string()),
    dayKey: v.number(),
    creadoPorId: v.optional(v.id('users')),
  })
    .index('by_operador', ['operadorId'])
    .index('by_day', ['dayKey']),
});
