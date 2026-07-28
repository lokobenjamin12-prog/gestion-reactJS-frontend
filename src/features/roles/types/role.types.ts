// Forme "légère" — celle imbriquée dans un User (ex: `user.role`), qui n'inclut
// jamais department/permissions/users (voir la réponse réelle de /auth/me).
export interface Role {
  id: number;
  nomRole: string;
  post: string;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  slug: string;
  description: string;
}

export interface RolePermissionEntry {
  permission: Permission;
}

export interface RoleUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  status: string;
  profilePicture?: string | null;
}

// Forme complète renvoyée par GET /roles et GET /roles/:id — le service backend
// inclut systématiquement department + permissions + users (cf. defaultInclude()).
export interface RoleWithRelations extends Role {
  department: Department;
  permissions: RolePermissionEntry[];
  users: RoleUserSummary[];
}

// La pagination de /roles utilise `hasPreviousPage`, pas `hasPrevPage` comme
// /users — nommage différent côté backend entre les deux endpoints, donc on ne
// peut pas réutiliser le type PaginationMeta partagé tel quel ici.
export interface RolesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedRolesResponse<T> {
  data: T[];
  meta: RolesPaginationMeta;
}
