import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRolesListQuery } from '../api/roles.queries';
import { useDepartmentsQuery } from '@/features/departments/api/departments.queries';
import { usePermissionsQuery } from '@/features/permissions/api/permissions.queries';
import { groupPermissionsByResource, humanizeAction } from '../lib/roleDisplay';
import type { RoleWithRelations } from '../types/role.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

// Le rôle qui porte ce slug court-circuite toutes les vérifications de
// permissions côté backend (super admin) — cf. BACKEND_CONTEXT.md §3.4.
const SUPER_ADMIN_SLUG = 'Manage_system';

function getPermissionsBadge(role: RoleWithRelations) {
  const isSuperAdmin = role.permissions.some((entry) => entry.permission.slug === SUPER_ADMIN_SLUG);
  const count = role.permissions.length;
  if (isSuperAdmin) {
    return { label: `Toutes (${count})`, className: 'bg-primary text-on-primary' };
  }
  return {
    label: `${count} permission${count > 1 ? 's' : ''}`,
    className: 'bg-surface-container text-on-surface-variant',
  };
}

export function RolesListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [permissionId, setPermissionId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Debounce : on attend que l'utilisateur arrête de taper avant d'interroger l'API.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, permissionId]);

  const { data, isLoading, isError, error } = useRolesListQuery({
    search: search || undefined,
    departmentId,
    permissionId,
    page,
    limit: 10,
  });
  const { data: departmentsData } = useDepartmentsQuery();
  const { data: permissionsData } = usePermissionsQuery();
  const permissionGroups = groupPermissionsByResource(permissionsData?.data ?? []);
  const canCreate = usePermission('role:create');
  const canUpdate = usePermission('role:update');

  const roles = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <div className="flex items-end justify-between py-xl">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <span>Administration</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-primary">Rôles &amp; Permissions</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Gestion des rôles</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Configurez les niveaux d'accès et les autorisations système pour chaque département.
          </p>
        </div>
        {canCreate ? (
          <Link to="/roles/new">
            <Button>
              <Icon name="add" />
              Nouveau rôle
            </Button>
          </Link>
        ) : (
          <Button title="Permission role:create requise" disabled>
            <Icon name="add" />
            Nouveau rôle
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-wrap items-center gap-md p-md">
          <div className="min-w-[280px] flex-1">
            <Input
              icon="search"
              placeholder="Filtrer par intitulé du poste..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Rechercher un rôle"
            />
          </div>
          <Select
            value={departmentId ?? ''}
            onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Tous les départements</option>
            {departmentsData?.data.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Select
            value={permissionId ?? ''}
            onChange={(e) => setPermissionId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Toutes les permissions</option>
            {permissionGroups.map((group) => (
              <optgroup key={group.resource} label={group.label}>
                {group.permissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {humanizeAction(permission.slug)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Poste
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Département
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Permissions
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Utilisateurs
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-lg py-md" colSpan={5}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={5}>
                    {getApiErrorMessage(error, 'Impossible de charger la liste des rôles.')}
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={5}
                  >
                    Aucun rôle ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                roles.map((role) => {
                  const badge = getPermissionsBadge(role);
                  const visibleUsers = role.users.slice(0, 3);
                  const extraUsers = role.users.length - visibleUsers.length;
                  return (
                    <tr key={role.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-sm">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                            <Icon name="shield_person" />
                          </div>
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            {role.post}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-sm">
                        <span className="rounded-full bg-surface-container px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                          {role.department?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-lg py-sm">
                        <span
                          className={`whitespace-nowrap rounded-full px-sm py-xs font-label-md text-label-md ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-lg py-sm">
                        {role.users.length === 0 ? (
                          <span className="font-label-md text-label-md text-on-surface-variant">—</span>
                        ) : (
                          <div className="flex items-center -space-x-2">
                            {visibleUsers.map((u) => (
                              <Avatar
                                key={u.id}
                                firstName={u.firstName}
                                lastName={u.lastName}
                                src={u.profilePicture}
                                title={`${u.firstName} ${u.lastName}`}
                                className="h-8 w-8 border-2 border-surface-container-lowest text-[10px] font-bold"
                              />
                            ))}
                            {extraUsers > 0 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-outline-variant text-[10px] font-bold text-on-surface">
                                +{extraUsers}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-lg py-sm text-right">
                        <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                          <Link
                            to={`/roles/${role.id}`}
                            title="Voir"
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                          >
                            <Icon name="visibility" className="text-[20px]" />
                          </Link>
                          {canUpdate ? (
                            <Link
                              to={`/roles/${role.id}/edit`}
                              title="Modifier"
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                            >
                              <Icon name="edit" className="text-[20px]" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              title="Permission role:update requise"
                              disabled
                              className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="edit" className="text-[20px]" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Bientôt disponible"
                            disabled
                            className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="delete" className="text-[20px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/30 p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} rôles
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page {meta.page} / {meta.lastPage}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
