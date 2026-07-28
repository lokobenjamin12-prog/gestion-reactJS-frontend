import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUsersQuery } from '../api/users.queries';
import { useRolesQuery } from '@/features/roles/api/roles.queries';
import { ArchiveUserDialog } from '../components/ArchiveUserDialog';
import { RestoreUserDialog } from '../components/RestoreUserDialog';
import type { User } from '../types/user.types';
import { getStatusBadge, formatDate } from '../lib/userDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

type StatusFilter = 'all' | 'active' | 'archived';

export function UsersListPage() {
  // Permet d'arriver sur cette page pré-filtrée par rôle (ex: lien "Voir tous
  // les utilisateurs" depuis la fiche d'un rôle) — lu une seule fois au
  // montage, comme valeur initiale du filtre local.
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>(() => {
    const initial = searchParams.get('roleId');
    return initial ? Number(initial) : undefined;
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [archivingUser, setArchivingUser] = useState<User | null>(null);
  const [restoringUser, setRestoringUser] = useState<User | null>(null);
  const canArchive = usePermission('user:archive');
  const canRestore = usePermission('user:restore');
  const canCreate = usePermission('authentification:create');
  const canUpdate = usePermission('user:update');

  // Debounce : on attend que l'utilisateur arrête de taper avant d'interroger l'API.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Revenir à la page 1 à chaque changement de filtre (sinon on pourrait se
  // retrouver sur une page qui n'existe plus pour les nouveaux critères).
  useEffect(() => {
    setPage(1);
  }, [search, roleId, statusFilter]);

  const { data, isLoading, isError, error } = useUsersQuery({
    search: search || undefined,
    roleId,
    estArchive: statusFilter === 'all' ? undefined : statusFilter === 'archived',
    page,
    limit: 10,
  });
  const { data: rolesData } = useRolesQuery();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <div className="flex items-center justify-between py-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Liste des utilisateurs</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Gérez les accès et les profils de vos collaborateurs.
          </p>
        </div>
        {canCreate ? (
          <Link to="/users/new">
            <Button>
              <Icon name="person_add" />
              Nouvel utilisateur
            </Button>
          </Link>
        ) : (
          <Button title="Permission authentification:create requise" disabled>
            <Icon name="person_add" />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-wrap items-center justify-between gap-md bg-surface-container-lowest/50 p-md">
          <div className="flex max-w-2xl flex-grow items-center gap-md">
            <div className="flex-grow">
              <Input
                icon="search"
                placeholder="Rechercher par nom, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Rechercher un utilisateur"
              />
            </div>
            <Select
              value={roleId ?? ''}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tous les rôles</option>
              {rolesData?.data.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nomRole}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="archived">Archivés</option>
            </Select>
          </div>
          <Button variant="outline" title="Bientôt disponible" disabled>
            <Icon name="filter_list" className="text-[18px]" />
            Plus de filtres
          </Button>
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Nom complet
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Email
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Rôle
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Statut
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Recrutement
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
                    <td className="px-lg py-md" colSpan={6}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={6}>
                    {getApiErrorMessage(error, 'Impossible de charger la liste des utilisateurs.')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    Aucun utilisateur ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const badge = getStatusBadge(user);
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-sm">
                          <Avatar
                            firstName={user.firstName}
                            lastName={user.lastName}
                            src={user.profilePicture}
                            className="h-8 w-8 text-[11px]"
                          />
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {user.email}
                      </td>
                      <td className="px-lg py-sm">
                        <span className="rounded border border-outline-variant bg-surface-container px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                          {user.role?.nomRole ?? '—'}
                        </span>
                      </td>
                      <td className="px-lg py-sm">
                        <div className={`flex items-center gap-xs font-label-md text-label-md ${badge.textClass}`}>
                          <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </div>
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {formatDate(user.dateRecrutement)}
                      </td>
                      <td className="px-lg py-sm text-right">
                        <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                          <Link
                            to={`/users/${user.id}`}
                            title="Voir"
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                          >
                            <Icon name="visibility" className="text-[20px]" />
                          </Link>
                          <Link
                            to={`/users/${user.id}/edit`}
                            title={canUpdate ? 'Modifier' : 'Permission user:update requise'}
                            aria-disabled={!canUpdate}
                            onClick={(e) => !canUpdate && e.preventDefault()}
                            className={`rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container ${
                              !canUpdate ? 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-on-surface-variant' : ''
                            }`}
                          >
                            <Icon name="edit" className="text-[20px]" />
                          </Link>
                          {user.estArchive ? (
                            <button
                              type="button"
                              title={canRestore ? 'Restaurer' : 'Permission user:restore requise'}
                              disabled={!canRestore}
                              onClick={() => setRestoringUser(user)}
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                            >
                              <Icon name="unarchive" className="text-[20px]" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title={canArchive ? 'Archiver' : 'Permission user:archive requise'}
                              disabled={!canArchive}
                              onClick={() => setArchivingUser(user)}
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                            >
                              <Icon name="archive" className="text-[20px]" />
                            </button>
                          )}
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
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} utilisateurs
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={!meta.hasPrevPage}
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

      <ArchiveUserDialog
        user={archivingUser}
        onClose={() => setArchivingUser(null)}
        onArchived={() => setArchivingUser(null)}
      />
      <RestoreUserDialog
        user={restoringUser}
        onClose={() => setRestoringUser(null)}
        onRestored={() => setRestoringUser(null)}
      />
    </>
  );
}
