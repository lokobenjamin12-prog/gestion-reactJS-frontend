import { api } from '@/shared/lib/axios';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type { User, UsersFilters } from '../types/user.types';
import type { AuthLog } from '../types/authLog.types';
import type { CreateUserPayload, UpdateUserPayload } from '../schemas/user.schemas';

export const usersApi = {
  list: (params: UsersFilters) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((res) => res.data),

  get: (id: string) => api.get<User>(`/users/${id}`).then((res) => res.data),

  // La création d'un utilisateur se fait via /auth/register (créé par un admin
  // connecté), pas via /users — c'est une particularité du backend, mais du
  // point de vue produit ça reste une action du module "Utilisateurs".
  create: (payload: CreateUserPayload) =>
    api.post<{ message: string; user: User }>('/auth/register', payload).then((res) => res.data),

  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, payload).then((res) => res.data),

  logs: (id: string, params: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<AuthLog>>(`/users/${id}/logs`, { params }).then((res) => res.data),

  archive: (id: string) =>
    api.patch<{ message: string }>(`/users/archive/${id}`).then((res) => res.data),

  restore: (id: string) =>
    api.patch<{ message: string }>(`/users/${id}/restore`).then((res) => res.data),

  uploadProfilePicture: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post<User>(`/users/${id}/profile-picture`, formData).then((res) => res.data);
  },
};
