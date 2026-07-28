import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contratsApi } from './contrats.api';
import type { ContratsFilters } from '../types/contrat.types';
import type { UpdateContratPayload } from '../schemas/contrat.schemas';

export const contratsKeys = {
  all: ['contrats'] as const,
  list: (filters: ContratsFilters) => ['contrats', 'list', filters] as const,
  detail: (id: string) => ['contrats', 'detail', id] as const,
  expirations: (delai: number) => ['contrats', 'expirations', delai] as const,
};

export function useContratsListQuery(filters: ContratsFilters) {
  return useQuery({
    queryKey: contratsKeys.list(filters),
    queryFn: () => contratsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useContratQuery(id: string) {
  return useQuery({
    queryKey: contratsKeys.detail(id),
    queryFn: () => contratsApi.get(id),
  });
}

/** Alimente le bandeau d'alerte de la liste + le futur écran "Alertes CDD". */
export function useContratExpirationsQuery(delai = 30) {
  return useQuery({
    queryKey: contratsKeys.expirations(delai),
    queryFn: () => contratsApi.expirations(delai),
  });
}

export function useCreateContratMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contratsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contratsKeys.all });
    },
    meta: { successMessage: 'Contrat créé avec succès.' },
  });
}

export function useUpdateContratMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContratPayload }) => contratsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contratsKeys.all });
      queryClient.setQueryData(contratsKeys.detail(data.id), data);
    },
    meta: { successMessage: 'Contrat mis à jour avec succès.' },
  });
}

export function useArchiveContratMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contratsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contratsKeys.all });
    },
  });
}

export function useRestoreContratMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contratsApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contratsKeys.all });
    },
    meta: { successMessage: 'Contrat restauré avec succès.' },
  });
}
