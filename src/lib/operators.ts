import { startOfDay, endOfDay } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabaseClient';

const TABLES = {
  TOUR_OPERATORS: 'tour_operators',
  BOATS: 'tour_operator_boats',
  SCHEDULES: 'tour_operator_schedules',
  RESERVATIONS: 'reservations'
} as const;

const extractOperatorId = (item: Record<string, unknown>): number | null => {
  const candidate = item.tour_operator_id ?? item.operador_id ?? item.operator_id;
  if (typeof candidate === 'number') {
    return candidate;
  }
  if (typeof candidate === 'string') {
    const parsed = Number.parseInt(candidate, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const coerceString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

export interface OperatorBoat {
  id?: number;
  nombre: string;
  capacidad: number;
  estado: string;
  tipo: string;
}

export interface TourOperator {
  id: number;
  nombre: string;
  contacto: {
    telefono: string;
    email: string;
    direccion: string;
  };
  botes: OperatorBoat[];
  personal: number;
  capacidadTotal: number;
  horarios: string[];
  especialidad: string;
  clientesHoy: number;
}

export interface ReservationRecord {
  id: number;
  operadorId: number;
  operadorNombre: string;
  personas: number;
  tipo: string;
  timestamp: string;
  horaSalida: string | null;
}

export interface OperatorsBundle {
  operators: TourOperator[];
  reservationsToday: ReservationRecord[];
}

const normaliseBoat = (boat: Record<string, unknown>): OperatorBoat => ({
  id: coerceNumber(boat.id),
  nombre: coerceString(boat.nombre ?? boat.name),
  capacidad: coerceNumber(boat.capacidad ?? boat.capacity),
  estado: coerceString(boat.estado ?? boat.status, 'Activo'),
  tipo: coerceString(boat.tipo ?? boat.type)
});

const normaliseSchedule = (schedule: Record<string, unknown>): string => {
  const value = schedule.hora ?? schedule.departure_time ?? schedule.hora_salida ?? schedule.time;
  return coerceString(value);
};

const normaliseReservation = (
  item: Record<string, unknown>,
  operatorNameMap: Map<number, string>
): ReservationRecord | null => {
  const operadorId = extractOperatorId(item);
  if (!operadorId) {
    return null;
  }

  const personas = coerceNumber(item.personas ?? item.passengers ?? item.cantidad ?? item.people, 0);
  const tipo = coerceString(item.tipo ?? item.type ?? 'Reserva');
  const timestamp = coerceString(item.created_at ?? item.timestamp ?? item.fecha ?? new Date().toISOString());
  const horaSalidaValue = item.hora_salida ?? item.departure_time ?? item.hora ?? null;
  const horaSalida = horaSalidaValue ? coerceString(horaSalidaValue) : null;

  return {
    id: coerceNumber(item.id),
    operadorId,
    operadorNombre: operatorNameMap.get(operadorId) ?? '',
    personas,
    tipo,
    timestamp,
    horaSalida
  };
};

export const fetchOperatorsBundle = async (): Promise<OperatorsBundle> => {
  const supabase = getSupabaseClient();

  const { data: operatorsData, error: operatorsError } = await supabase
    .from(TABLES.TOUR_OPERATORS)
    .select('*')
    .order('nombre', { ascending: true });

  if (operatorsError) {
    throw new Error(operatorsError.message);
  }

  const operators = operatorsData ?? [];
  const operatorIds = operators.map((op) => coerceNumber(op.id)).filter((id) => id > 0);

  const { data: boatsData, error: boatsError } = operatorIds.length
    ? await supabase.from(TABLES.BOATS).select('*').in('tour_operator_id', operatorIds)
    : { data: [] as Record<string, unknown>[], error: null };

  if (boatsError) {
    throw new Error(boatsError.message);
  }

  const { data: schedulesData, error: schedulesError } = operatorIds.length
    ? await supabase.from(TABLES.SCHEDULES).select('*').in('tour_operator_id', operatorIds)
    : { data: [] as Record<string, unknown>[], error: null };

  if (schedulesError) {
    throw new Error(schedulesError.message);
  }

  const boatsByOperator = new Map<number, OperatorBoat[]>();
  (boatsData ?? []).forEach((boat) => {
    const operadorId = extractOperatorId(boat);
    if (!operadorId) {
      return;
    }
    const list = boatsByOperator.get(operadorId) ?? [];
    list.push(normaliseBoat(boat));
    boatsByOperator.set(operadorId, list);
  });

  const schedulesByOperator = new Map<number, string[]>();
  (schedulesData ?? []).forEach((schedule) => {
    const operadorId = extractOperatorId(schedule);
    if (!operadorId) {
      return;
    }
    const normalised = normaliseSchedule(schedule);
    if (!normalised) {
      return;
    }
    const existing = schedulesByOperator.get(operadorId) ?? [];
    existing.push(normalised);
    schedulesByOperator.set(operadorId, existing);
  });

  const operatorNameMap = new Map<number, string>();
  operators.forEach((op) => {
    const id = coerceNumber(op.id);
    operatorNameMap.set(id, coerceString(op.nombre ?? op.name));
  });

  const now = new Date();
  const start = startOfDay(now).toISOString();
  const end = endOfDay(now).toISOString();

  const { data: reservationsData, error: reservationsError } = await supabase
    .from(TABLES.RESERVATIONS)
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  const clientsByOperator = new Map<number, number>();
  const reservationsToday: ReservationRecord[] = [];

  (reservationsData ?? []).forEach((item: Record<string, unknown>) => {
    const reservation = normaliseReservation(item, operatorNameMap);
    if (!reservation) {
      return;
    }
    reservationsToday.push(reservation);
    const current = clientsByOperator.get(reservation.operadorId) ?? 0;
    clientsByOperator.set(reservation.operadorId, current + reservation.personas);
  });

  const mappedOperators: TourOperator[] = operators.map((operator) => {
    const id = coerceNumber(operator.id);
    const horarios = (schedulesByOperator.get(id) ?? []).sort();

    return {
      id,
      nombre: coerceString(operator.nombre ?? operator.name),
      contacto: {
        telefono: coerceString(operator.telefono ?? operator.phone),
        email: coerceString(operator.email),
        direccion: coerceString(operator.direccion ?? operator.address)
      },
      botes: (boatsByOperator.get(id) ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      personal: coerceNumber(operator.personal ?? operator.staff_count),
      capacidadTotal: coerceNumber(operator.capacidad_total ?? operator.capacity_total),
      horarios,
      especialidad: coerceString(operator.especialidad ?? operator.specialty),
      clientesHoy: clientsByOperator.get(id) ?? 0
    };
  });

  return {
    operators: mappedOperators,
    reservationsToday
  };
};

export interface TourOperatorInput {
  id?: number;
  nombre: string;
  contacto: {
    telefono: string;
    email: string;
    direccion: string;
  };
  botes: OperatorBoat[];
  personal: number;
  capacidadTotal: number;
  horarios: string[];
  especialidad: string;
}

const sanitiseBoatPayload = (boat: OperatorBoat, tourOperatorId: number) => ({
  nombre: boat.nombre,
  capacidad: boat.capacidad,
  estado: boat.estado,
  tipo: boat.tipo,
  tour_operator_id: tourOperatorId
});

const sanitiseSchedulePayload = (hora: string, tourOperatorId: number) => ({
  hora,
  tour_operator_id: tourOperatorId
});

export const upsertTourOperator = async (input: TourOperatorInput): Promise<number> => {
  const supabase = getSupabaseClient();

  const { id, contacto, botes, horarios, personal, capacidadTotal, especialidad, nombre } = input;

  const operatorPayload = {
    id,
    nombre,
    telefono: contacto.telefono,
    email: contacto.email,
    direccion: contacto.direccion,
    personal,
    capacidad_total: capacidadTotal,
    especialidad
  };

  const { data: operatorResult, error } = await supabase
    .from(TABLES.TOUR_OPERATORS)
    .upsert(operatorPayload)
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const operatorId = coerceNumber(operatorResult?.id ?? id);

  if (!operatorId) {
    throw new Error('No se pudo determinar el identificador del tour operador.');
  }

  await supabase.from(TABLES.BOATS).delete().eq('tour_operator_id', operatorId);
  await supabase.from(TABLES.SCHEDULES).delete().eq('tour_operator_id', operatorId);

  const boatPayload = botes.filter((boat) => boat.nombre).map((boat) => sanitiseBoatPayload(boat, operatorId));
  if (boatPayload.length) {
    const { error: boatsError } = await supabase.from(TABLES.BOATS).insert(boatPayload);
    if (boatsError) {
      throw new Error(boatsError.message);
    }
  }

  const schedulePayload = horarios.filter(Boolean).map((hora) => sanitiseSchedulePayload(hora, operatorId));
  if (schedulePayload.length) {
    const { error: schedulesError } = await supabase.from(TABLES.SCHEDULES).insert(schedulePayload);
    if (schedulesError) {
      throw new Error(schedulesError.message);
    }
  }

  return operatorId;
};

export const deleteTourOperator = async (operatorId: number) => {
  const supabase = getSupabaseClient();

  await supabase.from(TABLES.BOATS).delete().eq('tour_operator_id', operatorId);
  await supabase.from(TABLES.SCHEDULES).delete().eq('tour_operator_id', operatorId);

  const { error } = await supabase
    .from(TABLES.TOUR_OPERATORS)
    .delete()
    .eq('id', operatorId);

  if (error) {
    throw new Error(error.message);
  }
};

export interface ReservationInput {
  tourOperatorId: number;
  personas: number;
  tipo?: string;
  horaSalida?: string | null;
}

export const createReservation = async (input: ReservationInput) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(TABLES.RESERVATIONS)
    .insert({
      tour_operator_id: input.tourOperatorId,
      personas: input.personas,
      tipo: input.tipo ?? 'Venta directa',
      hora_salida: input.horaSalida ?? null
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
