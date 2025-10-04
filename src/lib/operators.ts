import { endOfDay, startOfDay } from 'date-fns';

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

type StoredOperator = Omit<TourOperator, 'clientesHoy'>;

type StoredReservation = {
  id: number;
  operadorId: number;
  personas: number;
  tipo: string;
  timestamp: string;
  horaSalida: string | null;
};

interface OperatorsState {
  operators: StoredOperator[];
  reservations: StoredReservation[];
  nextOperatorId: number;
  nextReservationId: number;
}

const STORAGE_KEY = 'aquareservas::operators-state';

const DEFAULT_OPERATORS: StoredOperator[] = [
  {
    id: 1,
    nombre: 'Bahia Azul',
    contacto: {
      telefono: '311-555-0101',
      email: 'contacto@bahiaazul.mx',
      direccion: 'Muelle central 12'
    },
    botes: [
      { id: 1, nombre: 'Coral Uno', capacidad: 20, estado: 'Activo', tipo: 'Lancha' },
      { id: 2, nombre: 'Coral Dos', capacidad: 18, estado: 'Activo', tipo: 'Lancha' }
    ],
    personal: 8,
    capacidadTotal: 38,
    horarios: ['08:00', '11:00', '14:30'],
    especialidad: 'Snorkel familiar'
  },
  {
    id: 2,
    nombre: 'EcoMar Experiencias',
    contacto: {
      telefono: '311-555-0175',
      email: 'hola@ecomar.com',
      direccion: 'Av. Costera 201'
    },
    botes: [
      { id: 3, nombre: 'Libelula', capacidad: 24, estado: 'Activo', tipo: 'Catamaran' },
      { id: 4, nombre: 'Marea', capacidad: 16, estado: 'Mantenimiento', tipo: 'Lancha' }
    ],
    personal: 12,
    capacidadTotal: 40,
    horarios: ['09:15', '13:00'],
    especialidad: 'Tours ecologicos'
  },
  {
    id: 3,
    nombre: 'Reef Masters',
    contacto: {
      telefono: '311-555-0210',
      email: 'reservas@reefmasters.mx',
      direccion: 'Plaza Marina Local 5'
    },
    botes: [
      { id: 5, nombre: 'Pelicano', capacidad: 15, estado: 'Activo', tipo: 'Lancha' },
      { id: 6, nombre: 'Albatros', capacidad: 28, estado: 'Activo', tipo: 'Catamaran' }
    ],
    personal: 10,
    capacidadTotal: 43,
    horarios: ['07:30', '10:30', '15:00'],
    especialidad: 'Snorkel avanzado'
  }
];

const hasWindow = typeof window !== 'undefined';
const hasStorage = hasWindow && typeof window.localStorage !== 'undefined';

let cachedState: OperatorsState | null = null;

const cloneBoat = (boat: OperatorBoat): OperatorBoat => ({ ...boat });

const cloneStoredOperator = (operator: StoredOperator): StoredOperator => ({
  id: operator.id,
  nombre: operator.nombre,
  contacto: { ...operator.contacto },
  botes: operator.botes.map((boat) => cloneBoat(boat)),
  personal: operator.personal,
  capacidadTotal: operator.capacidadTotal,
  horarios: [...operator.horarios],
  especialidad: operator.especialidad
});

const toTourOperator = (operator: StoredOperator, clientesHoy = 0): TourOperator => ({
  id: operator.id,
  nombre: operator.nombre,
  contacto: { ...operator.contacto },
  botes: operator.botes.map((boat) => cloneBoat(boat)),
  personal: operator.personal,
  capacidadTotal: operator.capacidadTotal,
  horarios: [...operator.horarios],
  especialidad: operator.especialidad,
  clientesHoy
});

const cloneReservation = (reservation: StoredReservation): StoredReservation => ({ ...reservation });

const createDefaultState = (): OperatorsState => ({
  operators: DEFAULT_OPERATORS.map((operator) => cloneStoredOperator(operator)),
  reservations: [],
  nextOperatorId: DEFAULT_OPERATORS.length + 1,
  nextReservationId: 1
});

const readFromStorage = (): OperatorsState | null => {
  if (!hasStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as OperatorsState;
    if (!parsed || !Array.isArray(parsed.operators) || !Array.isArray(parsed.reservations)) {
      return null;
    }

    return {
      operators: parsed.operators.map((operator) => cloneStoredOperator(operator)),
      reservations: parsed.reservations.map((reservation) => cloneReservation(reservation)),
      nextOperatorId: typeof parsed.nextOperatorId === 'number' ? parsed.nextOperatorId : DEFAULT_OPERATORS.length + 1,
      nextReservationId: typeof parsed.nextReservationId === 'number' ? parsed.nextReservationId : 1
    };
  } catch (error) {
    console.warn('Failed to parse stored operators state', error);
    return null;
  }
};

const persistState = (state: OperatorsState) => {
  cachedState = state;

  if (hasStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist operators state', error);
    }
  }
};

const getState = (): OperatorsState => {
  if (cachedState) {
    return cachedState;
  }

  const stored = readFromStorage();
  if (stored) {
    cachedState = stored;
    return cachedState;
  }

  const defaults = createDefaultState();
  cachedState = defaults;
  persistState(defaults);
  return cachedState;
};

const findOperatorIndex = (state: OperatorsState, operatorId: number) => {
  return state.operators.findIndex((operator) => operator.id === operatorId);
};

export const fetchOperatorsBundle = async (): Promise<OperatorsBundle> => {
  const state = getState();

  const operators = state.operators.map((operator) => toTourOperator(operator, 0));
  const operatorById = new Map<number, TourOperator>(operators.map((operator) => [operator.id, operator]));
  const operatorName = new Map<number, string>(state.operators.map((operator) => [operator.id, operator.nombre]));

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const reservationsToday: ReservationRecord[] = state.reservations
    .filter((reservation) => {
      const createdAt = new Date(reservation.timestamp);
      return createdAt >= todayStart && createdAt <= todayEnd;
    })
    .map((reservation) => {
      const target = operatorById.get(reservation.operadorId);
      if (target) {
        target.clientesHoy += reservation.personas;
      }

      return {
        id: reservation.id,
        operadorId: reservation.operadorId,
        operadorNombre: operatorName.get(reservation.operadorId) ?? 'Operador',
        personas: reservation.personas,
        tipo: reservation.tipo,
        timestamp: reservation.timestamp,
        horaSalida: reservation.horaSalida ?? null
      };
    });

  operators.sort((a, b) => a.nombre.localeCompare(b.nombre));

  return { operators, reservationsToday };
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

const sanitiseBoat = (boat: OperatorBoat): OperatorBoat => ({
  nombre: boat.nombre,
  capacidad: Math.max(0, boat.capacidad),
  estado: boat.estado || 'Activo',
  tipo: boat.tipo || 'Lancha'
});

export const upsertTourOperator = async (input: TourOperatorInput): Promise<number> => {
  const state = getState();

  if (!input.nombre) {
    throw new Error('El operador debe tener un nombre.');
  }

  const cleanedBoats = input.botes.filter((boat) => boat.nombre).map((boat) => sanitiseBoat(boat));
  if (!cleanedBoats.length) {
    throw new Error('Registra al menos una embarcacion.');
  }

  let operatorId = typeof input.id === 'number' ? input.id : state.nextOperatorId;
  const storedOperator: StoredOperator = {
    id: operatorId,
    nombre: input.nombre,
    contacto: {
      telefono: input.contacto.telefono,
      email: input.contacto.email,
      direccion: input.contacto.direccion
    },
    botes: cleanedBoats,
    personal: input.personal,
    capacidadTotal: input.capacidadTotal,
    horarios: [...new Set(input.horarios.filter(Boolean))].sort(),
    especialidad: input.especialidad
  };

  const existingIndex = findOperatorIndex(state, operatorId);

  if (existingIndex >= 0) {
    state.operators[existingIndex] = storedOperator;
  } else {
    operatorId = state.nextOperatorId++;
    storedOperator.id = operatorId;
    state.operators.push(storedOperator);
  }

  persistState(state);

  return operatorId;
};

export const deleteTourOperator = async (operatorId: number) => {
  const state = getState();

  const index = findOperatorIndex(state, operatorId);
  if (index === -1) {
    throw new Error('El operador ya no existe.');
  }

  state.operators.splice(index, 1);
  state.reservations = state.reservations.filter((reservation) => reservation.operadorId !== operatorId);

  persistState(state);
};

export interface ReservationInput {
  tourOperatorId: number;
  personas: number;
  tipo?: string;
  horaSalida?: string | null;
}

export const createReservation = async (input: ReservationInput) => {
  const state = getState();
  const operator = state.operators.find((item) => item.id === input.tourOperatorId);

  if (!operator) {
    throw new Error('No se encontro el tour operador seleccionado.');
  }

  if (input.personas < 1) {
    throw new Error('La reserva debe incluir al menos una persona.');
  }

  const reservationId = state.nextReservationId++;
  const record: StoredReservation = {
    id: reservationId,
    operadorId: operator.id,
    personas: input.personas,
    tipo: input.tipo ?? 'Venta directa',
    timestamp: new Date().toISOString(),
    horaSalida: input.horaSalida ?? null
  };

  state.reservations.unshift(record);
  persistState(state);

  return { id: reservationId };
};

