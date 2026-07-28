import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContratsListQuery, useContratExpirationsQuery } from '../api/contrats.queries';
import { ArchiveContratDialog } from '../components/ArchiveContratDialog';
import { RestoreContratDialog } from '../components/RestoreContratDialog';
import { formatDate, getContratStatusBadge, getTypeBadgeClass } from '../lib/contratDisplay';
import type { Contrat, ContratType } from '../types/contrat.types';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function ContratsListPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [type, setType] = useState<ContratType | undefined>(undefined);
  const [dateDebutFrom, setDateDebutFrom] = useState<string | undefined>(undefined);
  const [dateDebutTo, setDateDebutTo] = useState<string | undefined>(undefined);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [archiving, setArchiving] = useState<Contrat | null>(null);
  const [restoring, setRestoring] = useState<Contrat | null>(null);

  useEffect(() => {
    setPage(1);
  }, [userId, type, dateDebutFrom, dateDebutTo, includeArchived]);

  const { data, isLoading, isError, error } = useContratsListQuery({
    userId,
    type,
    dateDebutFrom,
    dateDebutTo,
    includeArchived: includeArchived || undefined,
    page,
    limit: 10,
  });
  const { data: usersData } = useUsersQuery({ limit: 100 });
  const { data: expirations } = useContratExpirationsQuery(30);
  const canCreate = usePermission('contrat:create');
  const canUpdate = usePermission('contrat:update');
  const canDelete = usePermission('contrat:delete');
  const canRestore = usePermission('contrat:restore');

  const contrats = data?.data ?? [];
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
            <span className="font-bold text-primary">Contrats &amp; Alertes RH</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Contrats &amp; Alertes RH</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Gestion centralisée des collaborateurs et suivi des engagements contractuels.
          </p>
        </div>
        {canCreate ? (
          <Link to="/contrats/new">
            <Button>
              <Icon name="add" />
              Nouveau contrat
            </Button>
          </Link>
        ) : (
          <Button title="Permission contrat:create requise" disabled>
            <Icon name="add" />
            Nouveau contrat
          </Button>
        )}
      </div>

      {expirations && expirations.length > 0 && (
        <Link
          to="/contrats/expirations"
          className="group mb-lg flex items-center justify-between rounded-xl border border-on-tertiary-container/20 bg-tertiary-container p-lg text-on-tertiary-container transition-colors hover:bg-tertiary-container/90"
        >
          <div className="flex items-center gap-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-on-tertiary-container/10">
              <Icon name="warning" filled />
            </div>
            <div>
              <h3 className="font-title-md text-title-md">
                {expirations.length} CDD expire{expirations.length > 1 ? 'nt' : ''} bientôt
              </h3>
              <p className="font-body-sm text-body-sm opacity-80">
                Des actions sont requises pour le renouvellement ou la fin de mission.
              </p>
            </div>
          </div>
          <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Barre de filtres */}
        <div className="flex flex-wrap items-center gap-md p-md">
          <Select value={userId ?? ''} onChange={(e) => setUserId(e.target.value || undefined)} className="min-w-[240px]">
            <option value="">Tous les collaborateurs</option>
            {usersData?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
          <Select
            value={type ?? ''}
            onChange={(e) => setType((e.target.value || undefined) as ContratType | undefined)}
          >
            <option value="">Tous les types</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
          </Select>
          <div className="flex items-center gap-sm">
            <label htmlFor="dateDebutFrom" className="font-label-md text-label-md text-on-surface-variant">
              Début entre
            </label>
            <input
              id="dateDebutFrom"
              type="date"
              value={dateDebutFrom ?? ''}
              onChange={(e) => setDateDebutFrom(e.target.value || undefined)}
              className="h-10 rounded-lg border border-outline-variant bg-white px-sm font-body-sm text-body-sm outline-none focus:border-primary"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">et</span>
            <input
              id="dateDebutTo"
              type="date"
              value={dateDebutTo ?? ''}
              onChange={(e) => setDateDebutTo(e.target.value || undefined)}
              className="h-10 rounded-lg border border-outline-variant bg-white px-sm font-body-sm text-body-sm outline-none focus:border-primary"
            />
            {(dateDebutFrom || dateDebutTo) && (
              <button
                type="button"
                title="Réinitialiser les dates"
                onClick={() => {
                  setDateDebutFrom(undefined);
                  setDateDebutTo(undefined);
                }}
                className="rounded p-xs text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-sm">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">
              Inclure les contrats archivés
            </span>
          </label>
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Collaborateur
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Type
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Date début
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Date fin
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Statut
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
                    {getApiErrorMessage(error, 'Impossible de charger la liste des contrats.')}
                  </td>
                </tr>
              ) : contrats.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    Aucun contrat ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                contrats.map((contrat) => {
                  const statusBadge = getContratStatusBadge(contrat);
                  return (
                    <tr key={contrat.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-md">
                          <Avatar
                            firstName={contrat.user.firstName}
                            lastName={contrat.user.lastName}
                            src={contrat.user.profilePicture}
                            className="h-10 w-10 font-bold"
                          />
                          <div>
                            <div className="font-body-md text-body-md font-semibold text-on-surface">
                              {contrat.user.firstName} {contrat.user.lastName}
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant">
                              {contrat.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-sm">
                        <span
                          className={`rounded px-sm py-xs font-label-sm text-label-sm ${getTypeBadgeClass(contrat.type)}`}
                        >
                          {contrat.type}
                        </span>
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {formatDate(contrat.dateDebut)}
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {formatDate(contrat.dateFin)}
                      </td>
                      <td className="px-lg py-sm">
                        <span
                          className={`inline-flex items-center gap-xs rounded-full px-sm py-xs font-label-sm text-label-sm ${statusBadge.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClassName}`} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-lg py-sm text-right">
                        <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                          {contrat.deletedAt ? (
                            <button
                              type="button"
                              title="Un contrat archivé ne peut pas être consulté en détail"
                              disabled
                              className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="visibility" className="text-[20px]" />
                            </button>
                          ) : (
                            <Link
                              to={`/contrats/${contrat.id}`}
                              title="Voir"
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                            >
                              <Icon name="visibility" className="text-[20px]" />
                            </Link>
                          )}
                          {contrat.deletedAt ? (
                            <button
                              type="button"
                              title={canRestore ? 'Restaurer' : 'Permission contrat:restore requise'}
                              disabled={!canRestore}
                              onClick={() => setRestoring(contrat)}
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="unarchive" className="text-[20px]" />
                            </button>
                          ) : (
                            <>
                              {canUpdate && contrat.type === 'CDD' ? (
                                <Link
                                  to={`/contrats/${contrat.id}/edit`}
                                  title="Modifier"
                                  className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                                >
                                  <Icon name="edit" className="text-[20px]" />
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  title={contrat.type === 'CDI' ? 'Un CDI ne peut pas être modifié' : 'Permission contrat:update requise'}
                                  disabled
                                  className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Icon name="edit" className="text-[20px]" />
                                </button>
                              )}
                              <button
                                type="button"
                                title={canDelete ? 'Archiver' : 'Permission contrat:delete requise'}
                                disabled={!canDelete}
                                onClick={() => setArchiving(contrat)}
                                className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                              >
                                <Icon name="archive" className="text-[20px]" />
                              </button>
                            </>
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
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} contrats
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

      <ArchiveContratDialog
        contrat={archiving}
        onClose={() => setArchiving(null)}
        onArchived={() => setArchiving(null)}
      />
      <RestoreContratDialog
        contrat={restoring}
        onClose={() => setRestoring(null)}
        onRestored={() => setRestoring(null)}
      />
    </>
  );
}
