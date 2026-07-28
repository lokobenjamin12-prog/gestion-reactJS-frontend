import { api } from '@/shared/lib/axios';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type { Permission } from '@/features/roles/types/role.types';

export interface PermissionsFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export const permissionsApi = {
  list: (params?: PermissionsFilters) =>
    api.get<PaginatedResponse<Permission>>('/permissions', { params }).then((res) => res.data),
};
