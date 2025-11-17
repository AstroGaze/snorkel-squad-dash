import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

type SeedOperator = {
  nombre: string;
  contacto: {
    telefono: string;
    email: string;
    direccion: string;
  };
  botes: {
    nombre: string;
    capacidad: number;
    estado: string;
    tipo: string;
  }[];
  personal: number;
  capacidadTotal: number;
  horarios: string[];
  especialidad: string;
};

type SeedReservation = {
  operador: string;
  personas: number;
  horaSalida?: string;
  tipo?: string;
  registradoPor?: 'admin' | 'seller';
};

type WeeklySeed = {
  dayOffset: number;
  reservas: SeedReservation[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const SEED_OPERATORS: SeedOperator[] = [
  {
    nombre: 'Toto Tours',
    contacto: {
      telefono: '+52 999 101 2020',
      email: 'hola@tototours.mx',
      direccion: 'Marina Tortugas, Cancun, QR',
    },
    botes: [
      { nombre: 'Toto Explorer', capacidad: 18, estado: 'Activo', tipo: 'Lancha' },
      { nombre: 'Toto Breeze', capacidad: 20, estado: 'Activo', tipo: 'Catamaran' },
      { nombre: 'Toto Sunset', capacidad: 16, estado: 'Activo', tipo: 'Lancha' },
    ],
    personal: 18,
    capacidadTotal: 54,
    horarios: ['07:00', '09:30', '13:00', '16:30'],
    especialidad: 'Experiencias premium de snorkel y arrecife',
  },
  {
    nombre: 'Paco Tours',
    contacto: {
      telefono: '+52 998 222 4545',
      email: 'contacto@pacotours.mx',
      direccion: 'Boulevard Kukulkan km 6, Cancun, QR',
    },
    botes: [
      { nombre: 'Paco Breeze', capacidad: 22, estado: 'Activo', tipo: 'Catamaran' },
      { nombre: 'Paco Coral', capacidad: 18, estado: 'Activo', tipo: 'Lancha' },
      { nombre: 'Paco Sunset', capacidad: 20, estado: 'Activo', tipo: 'Lancha' },
    ],
    personal: 20,
    capacidadTotal: 60,
    horarios: ['08:00', '11:00', '14:30', '18:00'],
    especialidad: 'Tours familiares y paquetes corporativos',
  },
  {
    nombre: 'Actividad Panoraminca',
    contacto: {
      telefono: '+52 998 303 6767',
      email: 'info@panoraminca.mx',
      direccion: 'Puerto Juarez, Cancun, QR',
    },
    botes: [
      { nombre: 'Panoraminca I', capacidad: 24, estado: 'Activo', tipo: 'Catamaran' },
      { nombre: 'Panoraminca II', capacidad: 26, estado: 'Activo', tipo: 'Catamaran' },
      { nombre: 'Panoraminca III', capacidad: 22, estado: 'Activo', tipo: 'Lancha' },
    ],
    personal: 24,
    capacidadTotal: 72,
    horarios: ['06:30', '10:00', '13:30', '17:30'],
    especialidad: 'Recorridos panoramicos y experiencias sunset',
  },
];

const WEEKLY_ACTIVITY: WeeklySeed[] = [
  {
    dayOffset: 0,
    reservas: [
      { operador: 'Toto Tours', personas: 7, horaSalida: '07:00', tipo: 'Venta directa', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 9, horaSalida: '08:00', tipo: 'Hotel', registradoPor: 'admin' },
      { operador: 'Actividad Panoraminca', personas: 10, horaSalida: '10:00', tipo: 'Mayorista', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 5, horaSalida: '13:00', tipo: 'Crucero familiar', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 8, horaSalida: '17:30', tipo: 'Sunset deluxe', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 7, horaSalida: '18:00', tipo: 'Evento corporativo', registradoPor: 'admin' },
    ],
  },
  {
    dayOffset: 1,
    reservas: [
      { operador: 'Toto Tours', personas: 6, horaSalida: '07:00', tipo: 'Tour privado', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 8, horaSalida: '10:00', tipo: 'Visita fotografica', registradoPor: 'admin' },
      { operador: 'Paco Tours', personas: 7, horaSalida: '11:00', tipo: 'Mayorista', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 5, horaSalida: '14:30', tipo: 'Familia', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 6, horaSalida: '16:30', tipo: 'Hotel', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 9, horaSalida: '17:30', tipo: 'Sunset premium', registradoPor: 'admin' },
    ],
  },
  {
    dayOffset: 2,
    reservas: [
      { operador: 'Actividad Panoraminca', personas: 6, horaSalida: '06:30', tipo: 'Salida fotografica', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 5, horaSalida: '09:30', tipo: 'Venta directa', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 8, horaSalida: '11:00', tipo: 'Hotel', registradoPor: 'admin' },
      { operador: 'Toto Tours', personas: 7, horaSalida: '13:00', tipo: 'Crucero familiar', registradoPor: 'admin' },
      { operador: 'Actividad Panoraminca', personas: 9, horaSalida: '13:30', tipo: 'Eco tour', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 6, horaSalida: '18:00', tipo: 'Sunset corporativo', registradoPor: 'seller' },
    ],
  },
  {
    dayOffset: 3,
    reservas: [
      { operador: 'Toto Tours', personas: 7, horaSalida: '07:00', tipo: 'Paquete agencias', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 8, horaSalida: '08:00', tipo: 'Hotel', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 9, horaSalida: '10:00', tipo: 'Mayorista', registradoPor: 'admin' },
      { operador: 'Paco Tours', personas: 6, horaSalida: '14:30', tipo: 'Venta directa', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 5, horaSalida: '16:30', tipo: 'Tour privado', registradoPor: 'admin' },
      { operador: 'Actividad Panoraminca', personas: 7, horaSalida: '17:30', tipo: 'Sunset deluxe', registradoPor: 'seller' },
    ],
  },
  {
    dayOffset: 4,
    reservas: [
      { operador: 'Actividad Panoraminca', personas: 6, horaSalida: '06:30', tipo: 'Sunrise', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 7, horaSalida: '09:30', tipo: 'Hotel', registradoPor: 'admin' },
      { operador: 'Paco Tours', personas: 8, horaSalida: '11:00', tipo: 'Excursion grupal', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 6, horaSalida: '13:30', tipo: 'Paquete fotografico', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 7, horaSalida: '14:30', tipo: 'Mayorista', registradoPor: 'admin' },
      { operador: 'Toto Tours', personas: 6, horaSalida: '16:30', tipo: 'Tour privado', registradoPor: 'seller' },
    ],
  },
  {
    dayOffset: 5,
    reservas: [
      { operador: 'Toto Tours', personas: 5, horaSalida: '07:00', tipo: 'Venta directa', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 8, horaSalida: '08:00', tipo: 'Hotel', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 9, horaSalida: '10:00', tipo: 'Evento corporativo', registradoPor: 'admin' },
      { operador: 'Toto Tours', personas: 6, horaSalida: '13:00', tipo: 'Familia', registradoPor: 'seller' },
      { operador: 'Actividad Panoraminca', personas: 8, horaSalida: '17:30', tipo: 'Sunset deluxe', registradoPor: 'admin' },
      { operador: 'Paco Tours', personas: 7, horaSalida: '18:00', tipo: 'Sunset especial', registradoPor: 'seller' },
    ],
  },
  {
    dayOffset: 6,
    reservas: [
      { operador: 'Actividad Panoraminca', personas: 6, horaSalida: '06:30', tipo: 'Sunrise panoramico', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 7, horaSalida: '09:30', tipo: 'Hotel', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 7, horaSalida: '11:00', tipo: 'Mayorista', registradoPor: 'admin' },
      { operador: 'Actividad Panoraminca', personas: 5, horaSalida: '13:30', tipo: 'Eco tour', registradoPor: 'seller' },
      { operador: 'Paco Tours', personas: 6, horaSalida: '14:30', tipo: 'Venta directa', registradoPor: 'seller' },
      { operador: 'Toto Tours', personas: 8, horaSalida: '16:30', tipo: 'Evento privado', registradoPor: 'seller' },
    ],
  },
];

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const timeStringToMs = (hora: string) => {
  const [hour, minute] = hora.split(':').map((value) => Number.parseInt(value, 10));
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 12 * 60 * 60 * 1000; // default to noon if parsing fails
  }
  return hour * 60 * 60 * 1000 + minute * 60 * 1000;
};

const findSeedUser = async (ctx: MutationCtx, email: string) => {
  const normalised = email.trim().toLowerCase();
  const existing = await ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', normalised))
    .unique();
  return existing?._id;
};

export const ensureSeedOperators = async (ctx: MutationCtx) => {
  const existingOperators = await ctx.db.query('operators').collect();
  if (existingOperators.length > 0) {
    return;
  }

  const [adminId, sellerId] = await Promise.all([
    findSeedUser(ctx, 'admin@aquareservas.com'),
    findSeedUser(ctx, 'ventas@aquareservas.com'),
  ]);

  const operatorIds = new Map<string, Id<'operators'>>();
  const now = Date.now();

  for (const seed of SEED_OPERATORS) {
    const operatorId = await ctx.db.insert('operators', {
      nombre: seed.nombre,
      contacto: seed.contacto,
      botes: seed.botes,
      personal: seed.personal,
      capacidadTotal: seed.capacidadTotal,
      horarios: seed.horarios,
      especialidad: seed.especialidad,
      createdAt: now,
      updatedAt: now,
    });

    operatorIds.set(seed.nombre, operatorId);
  }

  const todayStart = startOfDay(now);

  for (const day of WEEKLY_ACTIVITY) {
    const dayStart = startOfDay(todayStart - day.dayOffset * DAY_MS);
    for (const reserva of day.reservas) {
      const operadorId = operatorIds.get(reserva.operador);
      if (!operadorId) {
        continue;
      }

      const horaSalida = reserva.horaSalida;
      const timestamp = new Date(
        horaSalida ? dayStart + timeStringToMs(horaSalida) : dayStart + 9 * 60 * 60 * 1000,
      ).toISOString();

      let creadoPorId: Id<'users'> | undefined;
      if (reserva.registradoPor === 'admin' && adminId) {
        creadoPorId = adminId;
      } else if (reserva.registradoPor === 'seller' && sellerId) {
        creadoPorId = sellerId;
      }

      await ctx.db.insert('reservations', {
        operadorId,
        personas: Math.max(1, Math.round(reserva.personas)),
        tipo: reserva.tipo ?? 'Venta directa',
        timestamp,
        horaSalida,
        dayKey: dayStart,
        creadoPorId,
      });
    }
  }
};
