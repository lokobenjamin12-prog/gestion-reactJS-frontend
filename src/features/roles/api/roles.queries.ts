import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type RolesFilters } from './roles.api';
import type { UpdateRolePayload } from '../schemas/role.schemas';

export const rolesKeys = {
  all: ['roles'] as const,
  list: ['roles', 'list'] as const,
  filtered: (filters: RolesFilters) => ['roles', 'list', filters] as const,
  detail: (id: number) => ['roles', 'detail', id] as const,
};

/** Utilisée pour peupler des filtres/selects (ex: liste des utilisateurs) — pas de pagination visible. */
export function useRolesQuery() {
  return useQuery({
    queryKey: rolesKeys.list,
    queryFn: () => rolesApi.list({ limit: 100 }),
  });
}

/** Utilisée par l'écran "Liste des rôles" — pagination et filtres réels. */
export function useRolesListQuery(filters: RolesFilters) {
  return useQuery({
    queryKey: rolesKeys.filtered(filters),
    queryFn: () => rolesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useRoleQuery(id: number) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => rolesApi.get(id),
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
    meta: { successMessage: 'Rôle supprimé avec succès.' },
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
    meta: { successMessage: 'Rôle créé avec succès.' },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) => rolesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      queryClient.setQueryData(rolesKeys.detail(data.id), data);
    },
    meta: { successMessage: 'Rôle mis à jour avec succès.' },
  });
}
