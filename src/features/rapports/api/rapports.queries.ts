import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rapportsApi } from './rapports.api';
import type { RapportsFilters } from '../types/rapport.types';
import type { CreateRapportPayload } from '../schemas/rapport.schemas';

export const rapportsKeys = {
  all: ['rapports'] as const,
  list: (filters: RapportsFilters) => ['rapports', 'list', filters] as const,
  detail: (id: string) => ['rapports', 'detail', id] as const,
};

export function useRapportsListQuery(filters: RapportsFilters) {
  return useQuery({
    queryKey: rapportsKeys.list(filters),
    queryFn: () => rapportsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useRapportQuery(id: string) {
  return useQuery({
    queryKey: rapportsKeys.detail(id),
    queryFn: () => rapportsApi.get(id),
    enabled: !!id,
  });
}

export function useGenererRapportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRapportPayload) => rapportsApi.generer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rapportsKeys.all });
    },
    meta: { successMessage: 'Rapport généré avec succès.' },
  });
}

export function useTelechargerRapportMutation() {
  return useMutation({
    mutationFn: (id: string) => rapportsApi.telecharger(id),
    meta: { skipToast: true },
  });
}

export function useArchiverRapportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rapportsApi.archiver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rapportsKeys.all });
    },
  });
}

export function useRestaurerRapportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rapportsApi.restaurer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rapportsKeys.all });
    },
  });
}
