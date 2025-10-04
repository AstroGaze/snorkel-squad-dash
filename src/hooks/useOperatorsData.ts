import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReservation,
  deleteTourOperator,
  fetchOperatorsBundle,
  type TourOperatorInput,
  upsertTourOperator,
  type OperatorsBundle
} from '@/lib/operators';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const OPERATORS_QUERY_KEY = ['operators-bundle'] as const;

const REALTIME_TABLES = [
  'reservations',
  'tour_operators',
  'tour_operator_boats',
  'tour_operator_schedules'
] as const;

const REALTIME_DEBOUNCE_MS = 150;
const OPERATORS_REALTIME_CHANNEL = 'operators-sync';
const OPERATORS_REALTIME_EVENT = 'operators:refresh';

const getOrCreateOperatorsChannel = (): RealtimeChannel => {
  const supabase = getSupabaseClient();
  const existing = supabase
    .getChannels()
    .find((candidate) => candidate.topic === OPERATORS_REALTIME_CHANNEL);

  if (existing) {
    return existing;
  }

  return supabase.channel(OPERATORS_REALTIME_CHANNEL, {
    config: {
      broadcast: { self: false }
    }
  });
};

const ensureOperatorsChannelJoined = async (
  channel?: RealtimeChannel
): Promise<RealtimeChannel | null> => {
  const targetChannel = channel ?? getOrCreateOperatorsChannel();

  if (targetChannel.state === 'joined') {
    return targetChannel;
  }

  return await new Promise<RealtimeChannel | null>((resolve) => {
    targetChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve(targetChannel);
      } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        resolve(null);
      }
    });
  });
};

const broadcastOperatorsRefresh = async () => {
  const channel = await ensureOperatorsChannelJoined();
  if (!channel) {
    console.warn('Supabase realtime channel is not ready to broadcast operators updates.');
    return;
  }

  const result = await channel.send({
    type: 'broadcast',
    event: OPERATORS_REALTIME_EVENT,
    payload: { emittedAt: new Date().toISOString() }
  });

  if (result === 'timed out') {
    console.warn('Supabase realtime broadcast timed out for operators channel.');
  } else if (result === 'error') {
    console.warn('Supabase realtime broadcast failed for operators channel.');
  }
};

export const useOperatorsBundle = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = getOrCreateOperatorsChannel();

    let debounceHandle: ReturnType<typeof setTimeout> | undefined;

    const scheduleInvalidate = () => {
      if (debounceHandle) {
        return;
      }

      debounceHandle = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
        debounceHandle = undefined;
      }, REALTIME_DEBOUNCE_MS);
    };

    channel.on('broadcast', { event: OPERATORS_REALTIME_EVENT }, scheduleInvalidate);

    REALTIME_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleInvalidate);
    });

    void ensureOperatorsChannelJoined(channel);

    return () => {
      if (debounceHandle) {
        clearTimeout(debounceHandle);
      }

      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
      void broadcastOperatorsRefresh();
    }
  });
};

export const useDeleteTourOperator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTourOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPERATORS_QUERY_KEY });
      void broadcastOperatorsRefresh();
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
      void broadcastOperatorsRefresh();
    }
  });
};

export type { TourOperatorInput } from '@/lib/operators';
