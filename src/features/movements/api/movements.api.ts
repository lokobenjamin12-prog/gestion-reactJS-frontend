import { api } from '@/shared/lib/axios';
import type {
  MovementResult,
  MovementsFilters,
  PaginatedMovementsResponse,
  StockAlertItem,
  StockOverviewItem,
} from '../types/movement.types';
import type { CreateMovementPayload } from '../schemas/movement.schemas';

export const movementsApi = {
  getStockOverview: () =>
    api.get<StockOverviewItem[]>('/movement-stock/get-stocks').then((res) => res.data),

  getAlerts: () =>
    api.get<StockAlertItem[]>('/movement-stock/Obtenir-Articles-En-Alerte').then((res) => res.data),

  getMouvements: (params?: MovementsFilters) =>
    api.get<PaginatedMovementsResponse>('/movement-stock/mouvements', { params }).then((res) => res.data),

  processMovement: (payload: CreateMovementPayload) =>
    api.post<MovementResult>('/movement-stock/mouvements', payload).then((res) => res.data),
};
