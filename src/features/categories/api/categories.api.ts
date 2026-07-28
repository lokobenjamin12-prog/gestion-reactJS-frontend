import { api } from '@/shared/lib/axios';
import type { CategoriesFilters, CategoryDetail, PaginatedCategoriesResponse } from '../types/category.types';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../schemas/category.schemas';

export interface CreateCategoryResponse {
  id: string;
  nomUnique: string;
  articleId: string;
  stockId: string;
  message: string;
}

export interface UpdateCategoryResponse {
  id: string;
  nomUnique: string;
  prixUnite: number;
  message: string;
  updatedAt: string;
}

export const categoriesApi = {
  list: (params?: CategoriesFilters) =>
    api.get<PaginatedCategoriesResponse>('/categories/find-all', { params }).then((res) => res.data),

  get: (id: string) => api.get<CategoryDetail>(`/categories/find-one/${id}`).then((res) => res.data),

  create: (payload: CreateCategoryPayload) =>
    api.post<CreateCategoryResponse>('/categories/create', payload).then((res) => res.data),

  update: (id: string, payload: UpdateCategoryPayload) =>
    api.patch<UpdateCategoryResponse>(`/categories/update/${id}`, payload).then((res) => res.data),

  archive: (id: string) =>
    api
      .patch<{ id: string; nomUnique: string; message: string; archivedAt: string }>(`/categories/soft-delete/${id}`)
      .then((res) => res.data),

  restore: (id: string) =>
    api
      .patch<{ id: string; nomUnique: string; articleNom: string; message: string }>(
        `/categories/restore-category/${id}`,
      )
      .then((res) => res.data),

  remove: (id: string) =>
    api
      .delete<{ id: string; nomUnique: string; articleNom: string; message: string; deletedAt: string }>(
        `/categories/delete/${id}`,
      )
      .then((res) => res.data),
};
