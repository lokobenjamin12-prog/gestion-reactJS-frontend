export interface DepartmentRoleSummary {
  id: number;
  nomRole: string;
  post: string;
  _count: { users: number };
}

export interface Department {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  // Présents sur GET /departments et GET /departments/:id, absents des usages
  // "dropdown" (limit=100 pour peupler un select) — d'où le caractère optionnel.
  roles?: DepartmentRoleSummary[];
  _count?: { roles: number };
}

export interface DepartmentsFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// Forme réelle de GET /departments : `lastPage` + `hasPreviousPage` (pas
// `hasPrevPage` comme le type générique partagé le supposait à tort).
export interface DepartmentsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedDepartmentsResponse<T> {
  data: T[];
  meta: DepartmentsPaginationMeta;
}
