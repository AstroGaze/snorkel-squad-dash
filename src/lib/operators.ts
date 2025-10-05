import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { getConvexHttpClient } from './convexClient';

export type TourOperatorId = Id<'operators'>;
export type ReservationId = Id<'reservations'>;

export interface OperatorBoat {
  nombre: string;
  capacidad: number;
  estado: string;
  tipo: string;
}

export interface TourOperator {
  id: TourOperatorId;
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
  id: ReservationId;
  operadorId: TourOperatorId;
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

export interface TourOperatorInput {
  id?: TourOperatorId;
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

export interface ReservationInput {
  tourOperatorId: TourOperatorId;
  personas: number;
  tipo?: string;
  horaSalida?: string;
}

const client = () => getConvexHttpClient();

export const fetchOperatorsBundle = async (): Promise<OperatorsBundle> => {
  return client().query(api.operators.getBundle, {});
};

export const upsertTourOperator = async (input: TourOperatorInput) => {
  return client().mutation(api.operators.saveOperator, { input });
};

export const deleteTourOperator = async (operatorId: TourOperatorId) => {
  await client().mutation(api.operators.removeOperator, { id: operatorId });
};

export const createReservation = async (input: ReservationInput) => {
  const payload = {
    operadorId: input.tourOperatorId,
    personas: input.personas,
    tipo: input.tipo,
    horaSalida: input.horaSalida,
  } as const;

  return client().mutation(api.operators.createReservation, payload);
};

