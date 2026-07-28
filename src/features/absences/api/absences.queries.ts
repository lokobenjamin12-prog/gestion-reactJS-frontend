import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { absencesApi } from './absences.api';
import type { AbsencesFilters } from '../types/absence.types';

export const absencesKeys = {
  all: ['absences'] as const,
  list: (filters: AbsencesFilters) => ['absences', 'list', filters] as const,
  detail: (userId: string, mois: number, annee: number) => ['absences', 'detail', userId, mois, annee] as const,
};

export function useAbsencesListQuery(filters: AbsencesFilters) {
  return useQuery({
    queryKey: absencesKeys.list(filters),
    queryFn: () => absencesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useAbsenceQuery(userId: string, mois: number, annee: number) {
  return useQuery({
    queryKey: absencesKeys.detail(userId, mois, annee),
    queryFn: () => absencesApi.get(userId, mois, annee),
    enabled: !!userId && !!mois && !!annee,
  });
}

export function useAjouterJoursMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: absencesApi.ajouterJours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absencesKeys.all });
    },
    meta: { successMessage: "Jour(s) d'absence ajouté(s) avec succès." },
  });
}

export function useMettreAJourJourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: absencesApi.mettreAJourJour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absencesKeys.all });
    },
    meta: { successMessage: 'Jour mis à jour avec succès.' },
  });
}

export function useSupprimerJourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: absencesApi.supprimerJour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absencesKeys.all });
    },
    meta: { successMessage: 'Jour supprimé avec succès.' },
  });
}
