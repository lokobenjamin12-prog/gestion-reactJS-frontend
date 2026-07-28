import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salairesApi } from './salaires.api';
import type {
  AjouterPrimePayload,
  EnregistrerVersementPayload,
  GenererFichePayload,
  InitialiserSalairePayload,
} from './salaires.api';
import type { SalairesFilters, MasseSalarialeFilters, HistoriquePaiementsQueryFilters } from '../types/salaire.types';

export const salairesKeys = {
  all: ['salaires'] as const,
  list: (filters: SalairesFilters) => ['salaires', 'list', filters] as const,
  detail: (id: string) => ['salaires', 'detail', id] as const,
};

export function useSalairesListQuery(filters: SalairesFilters) {
  return useQuery({
    queryKey: salairesKeys.list(filters),
    queryFn: () => salairesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useSalaireQuery(id: string) {
  return useQuery({
    queryKey: salairesKeys.detail(id),
    queryFn: () => salairesApi.get(id),
  });
}

function useSalaireMutationBase<TPayload>(
  mutationFn: (id: string, payload: TPayload) => Promise<import('../types/salaire.types').Salaire>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TPayload }) => mutationFn(id, payload),
    // Ne PAS écraser le cache avec `data` : ces endpoints (primes, versement)
    // renvoient le Salaire mis à jour sans la relation `user` incluse, ce qui
    // faisait planter SalaireDetailPage (`fiche.user.firstName` undefined).
    // On se contente d'invalider pour déclencher un refetch complet.
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salairesKeys.all });
      queryClient.invalidateQueries({ queryKey: salairesKeys.detail(data.id) });
    },
    meta: { successMessage },
  });
}

export function useMasseSalarialeQuery(filters: MasseSalarialeFilters) {
  return useQuery({
    queryKey: ['salaires', 'masse-salariale', filters] as const,
    queryFn: () => salairesApi.getMasseSalariale(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useHistoriquePaiementsQuery(userId: string, filters: HistoriquePaiementsQueryFilters) {
  return useQuery({
    queryKey: ['salaires', 'historique', userId, filters] as const,
    queryFn: () => salairesApi.getHistoriquePaiements(userId, filters),
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
}

export function useInitialiserSalaireMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitialiserSalairePayload) => salairesApi.initialiser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salairesKeys.all });
      queryClient.invalidateQueries({ queryKey: salairesKeys.detail(data.id) });
    },
    meta: { successMessage: 'Salaire initialisé avec succès.' },
  });
}

export function useAjouterPrimeMutation() {
  return useSalaireMutationBase<AjouterPrimePayload>(salairesApi.ajouterPrime, 'Prime ajoutée avec succès.');
}

export function useSupprimerPrimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, index }: { id: string; index: number }) => salairesApi.supprimerPrime(id, index),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salairesKeys.all });
      queryClient.invalidateQueries({ queryKey: salairesKeys.detail(data.id) });
    },
    meta: { successMessage: 'Prime supprimée avec succès.' },
  });
}

export function useCloturerMoisMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salairesApi.cloturerMois(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salairesKeys.all });
      queryClient.invalidateQueries({ queryKey: salairesKeys.detail(data.id) });
    },
    meta: { successMessage: 'Mois clôturé avec succès.' },
  });
}

export function useEnregistrerVersementMutation() {
  return useSalaireMutationBase<EnregistrerVersementPayload>(
    salairesApi.enregistrerVersement,
    'Versement enregistré avec succès.',
  );
}

export function useGenererFicheDePaieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GenererFichePayload }) =>
      salairesApi.genererFicheDePaie(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salairesKeys.all });
      queryClient.invalidateQueries({ queryKey: salairesKeys.detail(variables.id) });
    },
    meta: { successMessage: 'Fiche de paie générée avec succès.' },
  });
}

export function useTelechargerFicheMutation() {
  return useMutation({
    mutationFn: (id: string) => salairesApi.telechargerFiche(id),
    meta: { skipToast: true },
  });
}
