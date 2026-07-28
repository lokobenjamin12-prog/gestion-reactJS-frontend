import type { Permission, RolePermissionEntry } from '../types/role.types';

// Libellés français pour les ressources métier (préfixe avant ":" dans un
// slug de permission, ex: "USER:READ" → ressource "USER"). Liste basée sur
// les valeurs réellement observées dans les permissions du backend.
const RESOURCE_LABELS: Record<string, string> = {
  USER: 'Utilisateurs',
  ROLE: 'Rôles',
  PERMISSION: 'Permissions',
  AUTHENTIFICATION: 'Authentification',
  ENTREPRISE: 'Entreprise',
  SALESSESSION: 'Sessions commerciales',
  ARTICLE: 'Articles',
  CATEGORY: 'Catégories',
  MOVEMENT: 'Mouvements de stock',
  ABSENCE: 'Absences',
  CONTRAT: 'Contrats',
  DEPARTMENT: 'Départements',
  RAPPORT: 'Rapports',
  RETARD: 'Retards',
  SALAIRE: 'Salaires',
};

// Icône Material Symbols associée à chaque ressource — purement décoratif,
// une valeur par défaut ("folder") couvre toute ressource non listée ici.
const RESOURCE_ICONS: Record<string, string> = {
  USER: 'person',
  ROLE: 'security',
  PERMISSION: 'key',
  AUTHENTIFICATION: 'vpn_key',
  ENTREPRISE: 'business',
  SALESSESSION: 'shopping_cart',
  ARTICLE: 'inventory_2',
  CATEGORY: 'category',
  MOVEMENT: 'sync_alt',
  ABSENCE: 'event_busy',
  CONTRAT: 'description',
  DEPARTMENT: 'apartment',
  RAPPORT: 'bar_chart',
  RETARD: 'schedule',
  SALAIRE: 'payments',
};

function getResourceLabel(resource: string) {
  return RESOURCE_LABELS[resource] ?? resource.charAt(0) + resource.slice(1).toLowerCase();
}

export function getResourceIcon(resource: string) {
  return RESOURCE_ICONS[resource] ?? 'folder';
}

/** "READ_LOG" → "Read log" — lisible sans dictionnaire de traduction par action. */
export function humanizeAction(slug: string) {
  const action = slug.includes(':') ? slug.split(':')[1] : slug;
  const lower = action.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export interface PermissionGroup {
  resource: string;
  label: string;
  icon: string;
  permissions: Permission[];
}

/** Regroupe une liste de permissions par ressource (avant le ":" du slug), triées alphabétiquement. */
export function groupPermissionsByResource(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const resource = permission.slug.includes(':') ? permission.slug.split(':')[0] : 'Système';
    if (!groups.has(resource)) groups.set(resource, []);
    groups.get(resource)!.push(permission);
  }

  return Array.from(groups.entries())
    .map(([resource, perms]) => ({
      resource,
      label: resource === 'Système' ? resource : getResourceLabel(resource),
      icon: getResourceIcon(resource),
      permissions: perms.sort((a, b) => a.slug.localeCompare(b.slug)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Même regroupement, mais à partir des permissions d'un rôle (`{ permission }[]`). */
export function groupRolePermissionsByResource(entries: RolePermissionEntry[]): PermissionGroup[] {
  return groupPermissionsByResource(entries.map((entry) => entry.permission));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
