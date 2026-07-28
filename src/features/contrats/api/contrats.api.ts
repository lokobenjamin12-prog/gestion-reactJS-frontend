import { api } from '@/shared/lib/axios';
import type { Contrat, ContratsFilters, PaginatedContratsResponse } from '../types/contrat.types';
import type { CreateContratPayload, UpdateContratPayload } from '../schemas/contrat.schemas';

export const contratsApi = {
  list: (params?: ContratsFilters) =>
    api.get<PaginatedContratsResponse<Contrat>>('/contrats', { params }).then((res) => res.data),

  get: (id: string) => api.get<Contrat>(`/contrats/${id}`).then((res) => res.data),

  create: (payload: CreateContratPayload) => api.post<Contrat>('/contrats', payload).then((res) => res.data),

  // @Put(':id') côté backend, pas @Patch — seule la date de fin d'un CDD est modifiable.
  update: (id: string, payload: UpdateContratPayload) =>
    api.put<Contrat>(`/contrats/${id}`, payload).then((res) => res.data),

  // GET /contrats/expirations : contrats CDD arrivant à échéance sous `delai`
  // jours (30 par défaut côté backend si omis).
  expirations: (delai?: number) =>
    api
      .get<Contrat[]>('/contrats/expirations', { params: delai ? { delai } : undefined })
      .then((res) => res.data),

  // DELETE /contrats/:id : archivage logique (soft delete), pas une suppression définitive.
  archive: (id: string) => api.delete<{ message: string }>(`/contrats/${id}`).then((res) => res.data),

  restore: (id: string) => api.patch<Contrat>(`/contrats/${id}/restore`).then((res) => res.data),
};
