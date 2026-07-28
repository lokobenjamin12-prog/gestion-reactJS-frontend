import { api } from '@/shared/lib/axios';
import type { PaginatedSessionsResponse, SessionSummary, SessionsFilters } from '../types/session.types';
import type { CloseSessionPayload, OpenSessionPayload } from '../schemas/session.schemas';

// Routes réelles sous /sales-sessions (déplacées depuis /commerce-logs, qui
// entrait en collision avec le contrôleur d'audit log commercial).
export const sessionsApi = {
  list: (filters: SessionsFilters) =>
    api.get<PaginatedSessionsResponse>('/sales-sessions', { params: filters }).then((res) => res.data),

  getOne: (id: string) => api.get<SessionSummary>(`/sales-sessions/${id}`).then((res) => res.data),

  open: (payload: OpenSessionPayload) =>
    api.post<SessionSummary>('/sales-sessions/open-session', payload).then((res) => res.data),

  close: (id: string, payload: CloseSessionPayload) =>
    api.patch<SessionSummary>(`/sales-sessions/${id}/close-session`, payload).then((res) => res.data),

  cancel: (id: string, managerId: string) =>
    api.patch<SessionSummary>(`/sales-sessions/${id}/cancel`, null, { params: { managerId } }).then((res) => res.data),
};
