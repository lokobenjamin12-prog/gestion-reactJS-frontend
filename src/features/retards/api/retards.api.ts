import { api } from '@/shared/lib/axios';
import type { Retard, RetardsFilters, PaginatedRetardsResponse, JourRetard } from '../types/retard.types';

export interface AjouterJoursPayload {
  userId: string;
  mois: number;
  annee: number;
  jours: JourRetard[];
}

export interface MettreAJourJourPayload {
  userId: string;
  date: string;
  estJustifie: boolean;
  heureArrivee?: string;
}

export interface SupprimerJourPayload {
  userId: string;
  date: string;
}

export const retardsApi = {
  list: (params?: RetardsFilters) =>
    api.get<PaginatedRetardsResponse<Retard>>('/retards', { params }).then((res) => res.data),

  get: (userId: string, mois: number, annee: number) =>
    api.get<Retard>(`/retards/${userId}/${mois}/${annee}`).then((res) => res.data),

  ajouterJours: (payload: AjouterJoursPayload) =>
    api.post<Retard>('/retards/jours', payload).then((res) => res.data),

  mettreAJourJour: (payload: MettreAJourJourPayload) =>
    api.patch<Retard>('/retards/jour', payload).then((res) => res.data),

  // DELETE avec un corps de requête : axios exige de le passer via `data`.
  supprimerJour: (payload: SupprimerJourPayload) =>
    api.delete<Retard | null>('/retards/jour', { data: payload }).then((res) => res.data),
};
