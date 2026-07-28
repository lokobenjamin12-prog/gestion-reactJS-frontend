import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retardsApi } from './retards.api';
import type { RetardsFilters } from '../types/retard.types';

export const retardsKeys = {
  all: ['retards'] as const,
  list: (filters: RetardsFilters) => ['retards', 'list', filters] as const,
  detail: (userId: string, mois: number, annee: number) => ['retards', 'detail', userId, mois, annee] as const,
};

export function useRetardsListQuery(filters: RetardsFilters) {
  return useQuery({
    queryKey: retardsKeys.list(filters),
    queryFn: () => retardsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useRetardQuery(userId: string, mois: number, annee: number) {
  return useQuery({
    queryKey: retardsKeys.detail(userId, mois, annee),
    queryFn: () => retardsApi.get(userId, mois, annee),
    enabled: !!userId && !!mois && !!annee,
  });
}

export function useAjouterJoursRetardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retardsApi.ajouterJours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retardsKeys.all });
    },
    meta: { successMessage: 'Jour(s) de retard ajouté(s) avec succès.' },
  });
}

export function useMettreAJourJourRetardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retardsApi.mettreAJourJour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retardsKeys.all });
    },
    meta: { successMessage: 'Jour mis à jour avec succès.' },
  });
}

export function useSupprimerJourRetardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retardsApi.supprimerJour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retardsKeys.all });
    },
    meta: { successMessage: 'Jour supprimé avec succès.' },
  });
}
