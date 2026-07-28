import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDepartmentsListQuery } from '../api/departments.queries';
import { DeleteDepartmentDialog } from '../components/DeleteDepartmentDialog';
import type { Department } from '../types/department.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function DepartmentsListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Department | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading, isError, error } = useDepartmentsListQuery({
    search: search || undefined,
    page,
    limit: 10,
  });
  const canCreate = usePermission('department:create');
  const canUpdate = usePermission('department:update');
  const canDelete = usePermission('department:delete');

  const departments = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <div className="flex items-end justify-between py-xl">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <span>RH</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-primary">Départements</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Départements</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Structure organisationnelle de l'entreprise.
          </p>
        </div>
        {canCreate ? (
          <Link to="/departments/new">
            <Button>
              <Icon name="add" />
              Nouveau département
            </Button>
          </Link>
        ) : (
          <Button title="Permission department:create requise" disabled>
            <Icon name="add" />
            Nouveau département
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Recherche */}
        <div className="p-md">
          <Input
            icon="search"
            placeholder="Rechercher par nom..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Rechercher un département"
          />
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Nom du département
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Rôles rattachés
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Aperçu des rôles
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
                    <td className="px-lg py-md" colSpan={4}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={4}>
                    {getApiErrorMessage(error, 'Impossible de charger la liste des départements.')}
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={4}
                  >
                    Aucun département ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                departments.map((department) => {
                  const roles = department.roles ?? [];
                  const visibleRoles = roles.slice(0, 2);
                  const extraRoles = roles.length - visibleRoles.length;
                  const roleCount = department._count?.roles ?? roles.length;

                  return (
                    <tr key={department.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-md">
                        <span className="inline-flex items-center rounded-full bg-secondary-container px-md py-1 font-label-md text-label-md font-bold uppercase text-on-secondary-container">
                          {department.name}
                        </span>
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-2">
                          <span className="font-body-md text-body-md font-bold text-on-surface">{roleCount}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            poste{roleCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        {roles.length === 0 ? (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-xs">
                            {visibleRoles.map((role) => (
                              <span
                                key={role.id}
                                className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm uppercase text-on-secondary-fixed-variant"
                              >
                                {role.post}
                              </span>
                            ))}
                            {extraRoles > 0 && (
                              <span className="rounded bg-surface-container-highest px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                +{extraRoles}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                          <Link
                            to={`/departments/${department.id}`}
                            title="Voir"
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                          >
                            <Icon name="visibility" className="text-[20px]" />
                          </Link>
                          {canUpdate ? (
                            <Link
                              to={`/departments/${department.id}/edit`}
                              title="Modifier"
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                            >
                              <Icon name="edit" className="text-[20px]" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              title="Permission department:update requise"
                              disabled
                              className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="edit" className="text-[20px]" />
                            </button>
                          )}
                          <button
                            type="button"
                            title={canDelete ? 'Supprimer' : 'Permission department:delete requise'}
                            disabled={!canDelete}
                            onClick={() => setDeleting(department)}
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} départements
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

      <DeleteDepartmentDialog
        department={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => setDeleting(null)}
      />
    </>
  );
}
