import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from './departments.api';
import type { DepartmentsFilters } from '../types/department.types';
import type { UpdateDepartmentPayload } from '../schemas/department.schemas';

export const departmentsKeys = {
  all: ['departments'] as const,
  list: (filters: DepartmentsFilters) => ['departments', 'list', filters] as const,
  detail: (id: number) => ['departments', 'detail', id] as const,
};

/** Utilisée pour peupler des filtres/selects — pas de pagination visible. */
export function useDepartmentsQuery() {
  return useQuery({
    queryKey: departmentsKeys.list({ limit: 100 }),
    queryFn: () => departmentsApi.list({ limit: 100 }),
  });
}

/** Utilisée par l'écran "Liste des départements" — pagination et recherche réelles. */
export function useDepartmentsListQuery(filters: DepartmentsFilters) {
  return useQuery({
    queryKey: departmentsKeys.list(filters),
    queryFn: () => departmentsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useDepartmentQuery(id: number) {
  return useQuery({
    queryKey: departmentsKeys.detail(id),
    queryFn: () => departmentsApi.get(id),
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    },
    meta: { successMessage: 'Département créé avec succès.' },
  });
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDepartmentPayload }) =>
      departmentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(variables.id) });
    },
    meta: { successMessage: 'Département mis à jour avec succès.' },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
    },
    meta: { successMessage: 'Département supprimé avec succès.' },
  });
}
