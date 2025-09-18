import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReservation,
  deleteTourOperator,
  fetchOperatorsBundle,
  type TourOperatorInput,
  upsertTourOperator,
  type OperatorsBundle
} from '@/lib/operators';

export const OPERATORS_QUERY_KEY = ['operators-bundle'] as const;

export const useOperatorsBundle = () => {
  return useQuery<OperatorsBundle, Error>({
    queryKey: OPERATORS_QUERY_KEY,
    queryFn: fetchOperatorsBundle,
    staleTime: 60_000
  });
};

export const useUpsertTourOperator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertTourOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
    }
  });
};

export const useDeleteTourOperator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTourOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
    }
  });
};

interface CreateReservationArgs {
  tourOperatorId: number;
  personas: number;
  tipo?: string;
  horaSalida?: string | null;
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationArgs) => createReservation({
      tourOperatorId: input.tourOperatorId,
      personas: input.personas,
      tipo: input.tipo,
      horaSalida: input.horaSalida ?? null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
    }
  });
};

export type { TourOperatorInput } from '@/lib/operators';

