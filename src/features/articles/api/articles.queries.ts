import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from './articles.api';
import type { ArticlesFilters } from '../types/article.types';
import type { UpdateArticlePayload } from '../schemas/article.schemas';

export const articlesKeys = {
  all: ['articles'] as const,
  list: (filters: ArticlesFilters) => ['articles', 'list', filters] as const,
  detail: (id: string) => ['articles', 'detail', id] as const,
};

export function useArticlesListQuery(filters: ArticlesFilters) {
  return useQuery({
    queryKey: articlesKeys.list(filters),
    queryFn: () => articlesApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

/** Utilisée pour peupler des filtres/selects (ex: sélecteur d'article dans Catégories). */
export function useArticlesQuery() {
  const filters: ArticlesFilters = { status: 'ACTIVE', limit: 100 };
  return useQuery({
    queryKey: articlesKeys.list(filters),
    queryFn: () => articlesApi.list(filters),
  });
}

export function useArticleQuery(id: string) {
  return useQuery({
    queryKey: articlesKeys.detail(id),
    queryFn: () => articlesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
    },
  });
}

export function useCreateSimpleArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.createSimple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
    },
  });
}

export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateArticlePayload }) => articlesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      queryClient.invalidateQueries({ queryKey: articlesKeys.detail(variables.id) });
    },
  });
}

export function useArchiveArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
    },
  });
}

export function useRestoreArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
    },
    meta: { successMessage: 'Article restauré avec succès.' },
  });
}

export function useDeleteArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
    },
  });
}
