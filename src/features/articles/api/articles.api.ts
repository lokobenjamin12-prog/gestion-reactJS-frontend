import { api } from '@/shared/lib/axios';
import type { ArticleDetail, ArticlesFilters, PaginatedArticlesResponse } from '../types/article.types';
import type { CreateArticlePayload, CreateSimpleArticlePayload, UpdateArticlePayload } from '../schemas/article.schemas';

export interface CreateArticleResponse {
  id: string;
  stockId: string;
  message: string;
  articleName: string;
  categoryName: string;
}

export interface UpdateArticleResponse {
  id: string;
  nom: string;
  updatedAt: string;
  message: string;
}

export interface CreateSimpleArticleResponse {
  id: string;
  nom: string;
  createdAt: string;
  message: string;
}

export const articlesApi = {
  list: (params?: ArticlesFilters) =>
    api.get<PaginatedArticlesResponse>('/articles/find-all', { params }).then((res) => res.data),

  get: (id: string) => api.get<ArticleDetail>(`/articles/find-one/${id}`).then((res) => res.data),

  create: (payload: CreateArticlePayload) =>
    api.post<CreateArticleResponse>('/articles/create', payload).then((res) => res.data),

  createSimple: (payload: CreateSimpleArticlePayload) =>
    api.post<CreateSimpleArticleResponse>('/articles/simple-create-article', payload).then((res) => res.data),

  update: (id: string, payload: UpdateArticlePayload) =>
    api.patch<UpdateArticleResponse>(`/articles/update/${id}`, payload).then((res) => res.data),

  archive: (id: string) =>
    api
      .patch<{ id: string; message: string; deletedAt: string }>(`/articles/soft-delete/${id}`)
      .then((res) => res.data),

  restore: (id: string) =>
    api
      .patch<{ id: string; nom: string; message: string; restoredAt: string }>(`/articles/restore/${id}`)
      .then((res) => res.data),

  remove: (id: string) =>
    api
      .delete<{ deletedId: string; articleName: string; message: string; timestamp: string }>(
        `/articles/physical-delete/${id}`,
      )
      .then((res) => res.data),
};
