import { api } from '@/shared/lib/axios';
import type { Department, DepartmentsFilters, PaginatedDepartmentsResponse } from '../types/department.types';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../schemas/department.schemas';

export const departmentsApi = {
  list: (params?: DepartmentsFilters) =>
    api.get<PaginatedDepartmentsResponse<Department>>('/departments', { params }).then((res) => res.data),

  get: (id: number) => api.get<Department>(`/departments/${id}`).then((res) => res.data),

  create: (payload: CreateDepartmentPayload) =>
    api.post<Department>('/departments', payload).then((res) => res.data),

  update: (id: number, payload: UpdateDepartmentPayload) =>
    api.patch<Department>(`/departments/${id}`, payload).then((res) => res.data),

  // Le nom envoyé est trim() + toUpperCase() côté serveur — pas la peine de le
  // reproduire ici, la valeur affichée sera de toute façon rafraîchie depuis la réponse.
  remove: (id: number) => api.delete<Department>(`/departments/${id}`).then((res) => res.data),
};
