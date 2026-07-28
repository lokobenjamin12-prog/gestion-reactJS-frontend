import { api } from '@/shared/lib/axios';
import type { Absence, AbsencesFilters, PaginatedAbsencesResponse, JourAbsence } from '../types/absence.types';

export interface AjouterJoursPayload {
  userId: string;
  mois: number;
  annee: number;
  jours: JourAbsence[];
}

export interface MettreAJourJourPayload {
  userId: string;
  date: string;
  estJustifie: boolean;
}

export interface SupprimerJourPayload {
  userId: string;
  date: string;
}

export const absencesApi = {
  list: (params?: AbsencesFilters) =>
    api.get<PaginatedAbsencesResponse<Absence>>('/absences', { params }).then((res) => res.data),

  get: (userId: string, mois: number, annee: number) =>
    api.get<Absence>(`/absences/${userId}/${mois}/${annee}`).then((res) => res.data),

  ajouterJours: (payload: AjouterJoursPayload) =>
    api.post<Absence>('/absences/jours', payload).then((res) => res.data),

  mettreAJourJour: (payload: MettreAJourJourPayload) =>
    api.patch<Absence>('/absences/jour', payload).then((res) => res.data),

  // DELETE avec un corps de requête : axios exige de le passer via `data`.
  supprimerJour: (payload: SupprimerJourPayload) =>
    api.delete<Absence | null>('/absences/jour', { data: payload }).then((res) => res.data),

};
