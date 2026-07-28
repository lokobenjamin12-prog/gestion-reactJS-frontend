import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './users.api';
import type { UsersFilters } from '../types/user.types';
import type { UpdateUserPayload } from '../schemas/user.schemas';

export const usersKeys = {
  all: ['users'] as const,
  list: (filters: UsersFilters) => ['users', 'list', filters] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  logs: (id: string, page: number) => ['users', 'detail', id, 'logs', page] as const,
};

export function useUsersQuery(filters: UsersFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => usersApi.list(filters),
    placeholderData: (previousData) => previousData, // évite le flash de chargement en changeant de page/filtre
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
  });
}

export function useUserLogsQuery(id: string, page: number) {
  return useQuery({
    queryKey: usersKeys.logs(id, page),
    queryFn: () => usersApi.logs(id, { page, limit: 4 }),
    placeholderData: (previousData) => previousData,
  });
}

export function useArchiveUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useRestoreUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    meta: { successMessage: 'Utilisateur créé avec succès.' },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    meta: { successMessage: 'Utilisateur mis à jour avec succès.' },
  });
}

export function useUploadProfilePictureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => usersApi.uploadProfilePicture(id, file),
    onSuccess: (user) => {
      queryClient.setQueryData(usersKeys.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    meta: { successMessage: 'Photo de profil mise à jour avec succès.' },
  });
}

