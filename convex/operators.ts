import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';

type OperatorBoat = {
  nombre: string;
  capacidad: number;
  estado: string;
  tipo: string;
};

type OperatorContact = {
  telefono: string;
  email: string;
  direccion: string;
};

type OperatorInput = {
  id?: Id<'operators'>;
  nombre: string;
  contacto: OperatorContact;
  botes: OperatorBoat[];
  personal: number;
  capacidadTotal: number;
  horarios: string[];
  especialidad: string;
};

const boatValidator = v.object({
  nombre: v.string(),
  capacidad: v.number(),
  estado: v.string(),
  tipo: v.string(),
});

const contactValidator = v.object({
  telefono: v.string(),
  email: v.string(),
  direccion: v.string(),
});

const operatorInputValidator = v.object({
  id: v.optional(v.id('operators')),
  nombre: v.string(),
  contacto: contactValidator,
  botes: v.array(boatValidator),
  personal: v.number(),
  capacidadTotal: v.number(),
  horarios: v.array(v.string()),
  especialidad: v.string(),
});

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const sanitiseBoat = (boat: OperatorBoat): OperatorBoat => ({
  nombre: boat.nombre.trim(),
  capacidad: Math.max(0, Math.round(boat.capacidad)),
  estado: boat.estado.trim() || 'Activo',
  tipo: boat.tipo.trim() || 'Lancha',
});

const sanitiseContact = (contacto: OperatorContact): OperatorContact => ({
  telefono: contacto.telefono.trim(),
  email: contacto.email.trim(),
  direccion: contacto.direccion.trim(),
});

const sanitiseOperatorInput = (input: OperatorInput) => {
  const nombre = input.nombre.trim();
  if (!nombre) {
    throw new Error('El operador debe tener un nombre.');
  }

  const boats = input.botes
    .map((boat) => sanitiseBoat(boat))
    .filter((boat) => boat.nombre);
  if (boats.length === 0) {
    throw new Error('Registra al menos una embarcacion.');
  }

  const horarios = Array.from(new Set(input.horarios.map((hora) => hora.trim()).filter(Boolean))).sort();

  return {
    id: input.id,
    nombre,
    contacto: sanitiseContact(input.contacto),
    botes: boats,
    personal: Math.max(0, Math.round(input.personal)),
    capacidadTotal: Math.max(0, Math.round(input.capacidadTotal)),
    horarios,
    especialidad: input.especialidad.trim(),
  } satisfies OperatorInput;
};

const buildOperatorResponse = (operator: {
  _id: Id<'operators'>;
  nombre: string;
  contacto: OperatorContact;
  botes: OperatorBoat[];
  personal: number;
  capacidadTotal: number;
  horarios: string[];
  especialidad: string;
  createdAt: number;
  updatedAt?: number;
}, clientesHoy: number, clientesPrevios: number) => ({
  id: operator._id,
  nombre: operator.nombre,
  contacto: operator.contacto,
  botes: operator.botes,
  personal: operator.personal,
  capacidadTotal: operator.capacidadTotal,
  horarios: operator.horarios,
  especialidad: operator.especialidad,
  clientesHoy,
  clientesPrevios,
});

export const getBundle = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(todayStart - 1);
    const weekStart = startOfDay(todayStart - 6 * DAY_MS);

    const [operators, reservationsThisWeek] = await Promise.all([
      ctx.db.query('operators').collect(),
      ctx.db
        .query('reservations')
        .withIndex('by_day', (q) => q.gte('dayKey', weekStart).lte('dayKey', todayStart))
        .collect(),
    ]);

    const reservationsTodayDocs = reservationsThisWeek.filter((reservation) => reservation.dayKey === todayStart);
    const reservationsYesterdayDocs = reservationsThisWeek.filter((reservation) => reservation.dayKey === yesterdayStart);

    const clientesHoyPorOperador = new Map<Id<'operators'>, number>();
    const clientesPreviosPorOperador = new Map<Id<'operators'>, number>();
    const operadorNombre = new Map<Id<'operators'>, string>();
    const usuariosPorId = new Map<Id<'users'>, { email: string; role: 'admin' | 'seller' }>();

    operators.forEach((operator) => {
      clientesHoyPorOperador.set(operator._id, 0);
      clientesPreviosPorOperador.set(operator._id, 0);
      operadorNombre.set(operator._id, operator.nombre);
    });

    reservationsTodayDocs.forEach((reservation) => {
      const current = clientesHoyPorOperador.get(reservation.operadorId) ?? 0;
      clientesHoyPorOperador.set(reservation.operadorId, current + reservation.personas);
    });

    reservationsYesterdayDocs.forEach((reservation) => {
      const current = clientesPreviosPorOperador.get(reservation.operadorId) ?? 0;
      clientesPreviosPorOperador.set(reservation.operadorId, current + reservation.personas);
    });

    const weeklyTotals = new Map<
      number,
      {
        totalClientes: number;
        totalReservas: number;
        breakdown: Map<Id<'operators'>, { clientes: number; reservas: number }>;
      }
    >();

    const ensureWeeklyEntry = (dayKey: number) => {
      let entry = weeklyTotals.get(dayKey);
      if (!entry) {
        entry = { totalClientes: 0, totalReservas: 0, breakdown: new Map() };
        weeklyTotals.set(dayKey, entry);
      }
      return entry;
    };

    reservationsThisWeek.forEach((reservation) => {
      const entry = ensureWeeklyEntry(reservation.dayKey);
      entry.totalClientes += reservation.personas;
      entry.totalReservas += 1;

      const operatorStats = entry.breakdown.get(reservation.operadorId);
      if (operatorStats) {
        operatorStats.clientes += reservation.personas;
        operatorStats.reservas += 1;
      } else {
        entry.breakdown.set(reservation.operadorId, {
          clientes: reservation.personas,
          reservas: 1,
        });
      }
    });

    const creatorIds = Array.from(
      new Set(
        reservationsTodayDocs
          .map((reservation) => reservation.creadoPorId)
          .filter((value): value is Id<'users'> => Boolean(value))
      )
    );

    if (creatorIds.length > 0) {
      const creators = await Promise.all(creatorIds.map((userId) => ctx.db.get(userId)));
      creators.forEach((user) => {
        if (user) {
          usuariosPorId.set(user._id, { email: user.email, role: user.role });
        }
      });
    }

    const operatorList = operators
      .map((operator) =>
        buildOperatorResponse(
          operator,
          clientesHoyPorOperador.get(operator._id) ?? 0,
          clientesPreviosPorOperador.get(operator._id) ?? 0,
        ),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const weeklyPerformance = Array.from({ length: 7 }, (_, index) => {
      const dayKey = startOfDay(weekStart + index * DAY_MS);
      const stats = weeklyTotals.get(dayKey);

      const operadores = stats
        ? Array.from(stats.breakdown.entries())
            .map(([id, value]) => ({
              id,
              nombre: operadorNombre.get(id) ?? 'Operador',
              clientes: value.clientes,
              reservas: value.reservas,
            }))
            .sort((a, b) => b.clientes - a.clientes)
        : [];

      return {
        dayKey,
        isoDate: new Date(dayKey).toISOString(),
        totalClientes: stats?.totalClientes ?? 0,
        totalReservas: stats?.totalReservas ?? 0,
        operadores,
      };
    });

    const reservationsToday = reservationsTodayDocs
      .map((reservation) => {
        const creator = reservation.creadoPorId ? usuariosPorId.get(reservation.creadoPorId) ?? null : null;

        return {
          id: reservation._id,
          operadorId: reservation.operadorId,
          operadorNombre: operadorNombre.get(reservation.operadorId) ?? 'Operador',
          personas: reservation.personas,
          tipo: reservation.tipo ?? 'Venta directa',
          timestamp: reservation.timestamp,
          horaSalida: reservation.horaSalida ?? null,
          registradoPor: creator && reservation.creadoPorId
            ? { id: reservation.creadoPorId, email: creator.email, role: creator.role }
            : null,
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));


    return { operators: operatorList, reservationsToday, weeklyPerformance };
  },
});

export const saveOperator = mutation({
  args: { input: operatorInputValidator },
  handler: async (ctx, args) => {
    const payload = sanitiseOperatorInput(args.input);
    const now = Date.now();

    if (payload.id) {
      const existing = await ctx.db.get(payload.id);
      if (!existing) {
        throw new Error('El operador ya no existe.');
      }

      await ctx.db.patch(payload.id, {
        nombre: payload.nombre,
        contacto: payload.contacto,
        botes: payload.botes,
        personal: payload.personal,
        capacidadTotal: payload.capacidadTotal,
        horarios: payload.horarios,
        especialidad: payload.especialidad,
        updatedAt: now,
      });

      return payload.id;
    }

    const operatorId = await ctx.db.insert('operators', {
      nombre: payload.nombre,
      contacto: payload.contacto,
      botes: payload.botes,
      personal: payload.personal,
      capacidadTotal: payload.capacidadTotal,
      horarios: payload.horarios,
      especialidad: payload.especialidad,
      createdAt: now,
      updatedAt: now,
    });

    return operatorId;
  },
});

export const removeOperator = mutation({
  args: { id: v.id('operators') },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.id);
    if (!operator) {
      throw new Error('El operador ya no existe.');
    }

    const reservations = await ctx.db
      .query('reservations')
      .withIndex('by_operador', (q) => q.eq('operadorId', args.id))
      .collect();

    await Promise.all(reservations.map((reservation) => ctx.db.delete(reservation._id)));
    await ctx.db.delete(args.id);
  },
});

export const createReservation = mutation({
  args: {
    operadorId: v.id('operators'),
    personas: v.number(),
    tipo: v.optional(v.string()),
    horaSalida: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.operadorId);
    if (!operator) {
      throw new Error('No se encontro el tour operador seleccionado.');
    }

    if (args.personas < 1) {
      throw new Error('La reserva debe incluir al menos una persona.');
    }

    const now = new Date();
    const nowTimestamp = now.getTime();
    const dayKey = startOfDay(nowTimestamp);

    let creadoPorId: Id<'users'> | undefined;
    if (args.sessionToken) {
      const token = args.sessionToken.trim();
      if (token) {
        const session = await ctx.db
          .query('sessions')
          .withIndex('by_token', (q) => q.eq('token', token))
          .unique();

        if (session && (!session.expiresAt || session.expiresAt > nowTimestamp)) {
          creadoPorId = session.userId;
        }
      }
    }

    const reservationId = await ctx.db.insert('reservations', {
      operadorId: args.operadorId,
      personas: Math.round(args.personas),
      tipo: args.tipo?.trim() || 'Venta directa',
      timestamp: now.toISOString(),
      horaSalida: args.horaSalida,
      dayKey,
      creadoPorId,
    });

    return { id: reservationId };
  },
});





