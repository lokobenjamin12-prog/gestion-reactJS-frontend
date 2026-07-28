import { api } from '@/shared/lib/axios';
import type {
  GenerateRapportResult,
  PaginatedRapportsResponse,
  Rapport,
  RapportsFilters,
} from '../types/rapport.types';
import type { CreateRapportPayload } from '../schemas/rapport.schemas';

export const rapportsApi = {
  list: (params?: RapportsFilters) =>
    api.get<PaginatedRapportsResponse<Rapport>>('/rapports', { params }).then((res) => res.data),

  get: (id: string) => api.get<Rapport>(`/rapports/${id}`).then((res) => res.data),

  generer: (payload: CreateRapportPayload) =>
    api.post<GenerateRapportResult>('/rapports/generer', payload).then((res) => res.data),

  // responseType 'blob' : passe par l'instance axios (donc par le refresh 401 automatique).
  telecharger: (id: string) =>
    api.get(`/rapports/${id}/telecharger`, { responseType: 'blob' }).then((res) => res.data as Blob),

  archiver: (id: string) => api.delete(`/rapports/${id}/supprimer`).then((res) => res.data),

  restaurer: (id: string) => api.patch(`/rapports/${id}/restore`).then((res) => res.data),
};
