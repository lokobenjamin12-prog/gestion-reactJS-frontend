import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementsApi } from './movements.api';
import type { MovementsFilters } from '../types/movement.types';
import type { CreateMovementPayload } from '../schemas/movement.schemas';

export const movementsKeys = {
  overview: ['movements', 'overview'] as const,
  alerts: ['movements', 'alerts'] as const,
  history: (filters: MovementsFilters) => ['movements', 'history', filters] as const,
};

export function useStockOverviewQuery() {
  return useQuery({
    queryKey: movementsKeys.overview,
    queryFn: movementsApi.getStockOverview,
  });
}

export function useStockAlertsQuery() {
  return useQuery({
    queryKey: movementsKeys.alerts,
    queryFn: movementsApi.getAlerts,
  });
}

export function useMouvementsHistoryQuery(filters: MovementsFilters) {
  return useQuery({
    queryKey: movementsKeys.history(filters),
    queryFn: () => movementsApi.getMouvements(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMovementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) => movementsApi.processMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsKeys.overview });
      queryClient.invalidateQueries({ queryKey: movementsKeys.alerts });
      queryClient.invalidateQueries({ queryKey: ['movements', 'history'] });
    },
    meta: { successMessage: 'Mouvement de stock enregistré avec succès.' },
  });
}
