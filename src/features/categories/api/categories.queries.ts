import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from './categories.api';
import type { CategoriesFilters } from '../types/category.types';
import type { UpdateCategoryPayload } from '../schemas/category.schemas';

export const categoriesKeys = {
  all: ['categories'] as const,
  list: (filters: CategoriesFilters) => ['categories', 'list', filters] as const,
  detail: (id: string) => ['categories', 'detail', id] as const,
};

export function useCategoriesListQuery(filters: CategoriesFilters) {
  return useQuery({
    queryKey: categoriesKeys.list(filters),
    queryFn: () => categoriesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      categoriesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(variables.id) });
    },
  });
}

export function useCategoryQuery(id: string) {
  return useQuery({
    queryKey: categoriesKeys.detail(id),
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
  });
}

export function useArchiveCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}

export function useRestoreCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
    },
  });
}
