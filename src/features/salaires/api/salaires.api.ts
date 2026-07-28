import { api } from '@/shared/lib/axios';
import type {
  Salaire,
  SalairesFilters,
  PaginatedSalairesResponse,
  MasseSalarialeResponse,
  MasseSalarialeFilters,
  HistoriquePaiementsResponse,
  HistoriquePaiementsQueryFilters,
} from '../types/salaire.types';

export interface AjouterPrimePayload {
  somme: number;
  raison: string;
}

export interface EnregistrerVersementPayload {
  montantVerse: number;
}

export interface GenererFichePayload {
  jourDePaie: string;
}

export interface InitialiserSalairePayload {
  userId: string;
  mois: number;
  annee: number;
}

export const salairesApi = {
  list: (params?: SalairesFilters) =>
    api.get<PaginatedSalairesResponse<Salaire>>('/salaires', { params }).then((res) => res.data),

  get: (id: string) => api.get<Salaire>(`/salaires/${id}`).then((res) => res.data),

  initialiser: (payload: InitialiserSalairePayload) =>
    api.post<Salaire>('/salaires/initialiser', payload).then((res) => res.data),

  getMasseSalariale: (params: MasseSalarialeFilters) =>
    api.get<MasseSalarialeResponse>('/salaires/masse-salariale', { params }).then((res) => res.data),

  getHistoriquePaiements: (userId: string, params: HistoriquePaiementsQueryFilters) =>
    api
      .get<HistoriquePaiementsResponse>(`/salaires/user/${userId}/historique-paiements`, { params })
      .then((res) => res.data),

  ajouterPrime: (id: string, payload: AjouterPrimePayload) =>
    api.patch<Salaire>(`/salaires/${id}/primes`, payload).then((res) => res.data),

  // DELETE avec un corps de requête : axios exige de le passer via `data`.
  supprimerPrime: (id: string, index: number) =>
    api.delete<Salaire>(`/salaires/${id}/primes`, { data: { index } }).then((res) => res.data),

  cloturerMois: (id: string) => api.post<Salaire>(`/salaires/${id}/cloturer`).then((res) => res.data),

  enregistrerVersement: (id: string, payload: EnregistrerVersementPayload) =>
    api.post<Salaire>(`/salaires/${id}/versements`, payload).then((res) => res.data),

  genererFicheDePaie: (id: string, payload: GenererFichePayload) =>
    api.post(`/salaires/${id}/fiche-de-paie`, payload).then((res) => res.data),

  // responseType 'blob' : passe par l'instance axios (donc par le refresh 401 automatique),
  // contrairement à un simple <a href> qui contournerait l'intercepteur d'authentification.
  telechargerFiche: (id: string) =>
    api.get(`/salaires/${id}/telecharger-fiche`, { responseType: 'blob' }).then((res) => res.data as Blob),
};
