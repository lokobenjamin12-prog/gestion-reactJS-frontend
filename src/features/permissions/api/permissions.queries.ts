import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from './permissions.api';

export const permissionsKeys = {
  list: ['permissions', 'list'] as const,
};

/** Récupère toutes les permissions du système, pour construire la matrice de sélection. */
export function usePermissionsQuery() {
  return useQuery({
    queryKey: permissionsKeys.list,
    queryFn: () => permissionsApi.list({ limit: 100 }),
  });
}
