import { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { OperatorsBundle, ReservationId, TourOperatorId, TourOperatorInput } from '@/lib/operators';

type MutationFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

const usePendingMutation = <TArgs, TResult>(mutateFn: MutationFn<TArgs, TResult>) => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (args: TArgs) => {
      setIsPending(true);
      try {
        return await mutateFn(args);
      } finally {
        setIsPending(false);
      }
    },
    [mutateFn],
  );

  return { mutateAsync, isPending };
};

export const useOperatorsBundle = () => {
  const data = useQuery(api.operators.getBundle, {});

  return {
    data: data as OperatorsBundle | undefined,
    isLoading: data === undefined,
    isError: false,
    error: null as Error | null,
  };
};

export const useUpsertTourOperator = () => {
  const mutation = useMutation(api.operators.saveOperator);
  return usePendingMutation<TourOperatorInput, TourOperatorId>((input) => mutation({ input }));
};

export const useDeleteTourOperator = () => {
  const mutation = useMutation(api.operators.removeOperator);
  return usePendingMutation<TourOperatorId, void>((id) => mutation({ id }));
};

interface CreateReservationArgs {
  tourOperatorId: TourOperatorId;
  personas: number;
  tipo?: string;
  horaSalida?: string;
}

export const useCreateReservation = () => {
  const mutation = useMutation(api.operators.createReservation);
  return usePendingMutation<CreateReservationArgs, { id: ReservationId }>((input) =>
    mutation({
      operadorId: input.tourOperatorId,
      personas: input.personas,
      tipo: input.tipo,
      horaSalida: input.horaSalida,
    }),
  );
};

export type { TourOperatorInput } from '@/lib/operators';
