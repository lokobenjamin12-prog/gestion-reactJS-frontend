import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from './sessions.api';
import type { SessionsFilters } from '../types/session.types';
import type { CloseSessionPayload, OpenSessionPayload } from '../schemas/session.schemas';
import { movementsKeys } from '@/features/movements/api/movements.queries';

export const sessionsKeys = {
  list: (filters: SessionsFilters) => ['sessions', 'list', filters] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
};

export function useSessionsListQuery(filters: SessionsFilters) {
  return useQuery({
    queryKey: sessionsKeys.list(filters),
    queryFn: () => sessionsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useSessionQuery(id: string) {
  return useQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsApi.getOne(id),
    enabled: !!id,
  });
}

export function useOpenSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenSessionPayload) => sessionsApi.open(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: movementsKeys.overview });
      queryClient.invalidateQueries({ queryKey: movementsKeys.alerts });
    },
    meta: { successMessage: 'Session ouverte avec succès.' },
  });
}

export function useCloseSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CloseSessionPayload }) => sessionsApi.close(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: sessionsKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: movementsKeys.overview });
      queryClient.invalidateQueries({ queryKey: movementsKeys.alerts });
    },
    meta: { successMessage: 'Session clôturée avec succès.' },
  });
}

export function useCancelSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) => sessionsApi.cancel(id, managerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: sessionsKeys.detail(data.id) });
    },
    meta: { successMessage: 'Session annulée avec succès.' },
  });
}
