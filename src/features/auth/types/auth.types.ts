export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';

export interface Permission {
  id: number;
  slug: string;
  description: string;
}

/** La forme exacte dépend de l'endpoint (liste brute ou via la table pivot RolePermission) — on gère les deux. */
export type RolePermissionEntry = Permission | { permission: Permission };

export interface AuthRole {
  id: number;
  nomRole: string;
  post: string;
  departmentId: number;
  permissions?: RolePermissionEntry[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  profilePicture?: string | null;
  verified: boolean;
  active: boolean;
  status: AccountStatus;
  role: AuthRole;
  createdAt: string;
  updatedAt: string;
}

export function extractPermissionSlugs(role: AuthRole | undefined | null): string[] {
  if (!role?.permissions) return [];
  return role.permissions.map((entry) => ('slug' in entry ? entry.slug : entry.permission.slug));
}
