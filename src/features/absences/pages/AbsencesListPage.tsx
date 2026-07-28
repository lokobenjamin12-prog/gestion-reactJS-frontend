import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAbsencesListQuery } from '../api/absences.queries';
import { formatPeriode, countJours, MOIS_LABELS } from '../lib/absenceDisplay';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const CURRENT_YEAR = new Date().getFullYear();

export function AbsencesListPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [mois, setMois] = useState<number | undefined>(undefined);
  const [annee, setAnnee] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [userId, mois, annee]);

  const { data, isLoading, isError, error } = useAbsencesListQuery({ userId, mois, annee, page, limit: 10 });
  const { data: usersData } = useUsersQuery({ limit: 100 });
  const canCreate = usePermission('absence:create');
  const canRead = usePermission('absence:read');

  const fiches = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const hasPreviousPage = !!meta && meta.page > 1;
  const hasNextPage = !!meta && meta.page < meta.totalPages;

  return (
    <>
      <div className="flex items-end justify-between py-xl">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <span>RH</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-primary">Absences</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Absences</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Suivi mensuel des absences des collaborateurs.
          </p>
        </div>
        {canCreate ? (
          <Link to="/absences/new">
            <Button>
              <Icon name="add" />
              Ajouter des jours d'absence
            </Button>
          </Link>
        ) : (
          <Button title="Permission absence:create requise" disabled>
            <Icon name="add" />
            Ajouter des jours d'absence
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Filtres */}
        <div className="flex flex-wrap items-end gap-md p-md">
          <div className="flex flex-col gap-xs">
            <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Collaborateur</label>
            <Select value={userId ?? ''} onChange={(e) => setUserId(e.target.value || undefined)} className="min-w-[220px]">
              <option value="">Tous les collaborateurs</option>
              {usersData?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Mois</label>
            <Select
              value={mois ?? ''}
              onChange={(e) => setMois(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tous les mois</option>
              {MOIS_LABELS.slice(1).map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Année</label>
            <input
              type="number"
              placeholder={String(CURRENT_YEAR)}
              value={annee ?? ''}
              onChange={(e) => setAnnee(e.target.value ? Number(e.target.value) : undefined)}
              className="w-28 rounded-lg border border-outline-variant bg-white px-md py-sm font-label-md text-label-md text-on-surface-variant outline-none focus:border-primary"
            />
          </div>
          {(userId || mois || annee) && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setUserId(undefined);
                setMois(undefined);
                setAnnee(undefined);
              }}
            >
              <Icon name="filter_list" className="text-[18px]" />
              Réinitialiser
            </Button>
          )}
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
                  Période
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Jours justifiés
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Jours injustifiés
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Total
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
                    {getApiErrorMessage(error, 'Impossible de charger les fiches d\'absence.')}
                  </td>
                </tr>
              ) : fiches.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    Aucune fiche d'absence enregistrée pour ces critères.
                  </td>
                </tr>
              ) : (
                fiches.map((fiche) => {
                  const counts = countJours(fiche.jours);
                  return (
                    <tr key={fiche.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-md">
                          <Avatar
                            firstName={fiche.user.firstName}
                            lastName={fiche.user.lastName}
                            src={fiche.user.profilePicture}
                            className="h-10 w-10 font-bold"
                          />
                          <div>
                            <div className="font-body-md text-body-md font-semibold text-on-surface">
                              {fiche.user.firstName} {fiche.user.lastName}
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant">
                              {fiche.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {formatPeriode(fiche.mois, fiche.annee)}
                      </td>
                      <td className="px-lg py-sm text-center">
                        <span className="inline-flex items-center rounded-lg bg-surface-container px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                          {counts.justifies} jour{counts.justifies > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-lg py-sm text-center">
                        <span
                          className={`inline-flex items-center rounded-lg px-sm py-xs font-label-md text-label-md ${
                            counts.injustifies > 0
                              ? 'bg-error text-on-error'
                              : 'border border-error/20 bg-error-container text-on-error-container'
                          }`}
                        >
                          {counts.injustifies} jour{counts.injustifies > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-lg py-sm text-center font-bold text-body-md text-primary">
                        {counts.total}
                      </td>
                      <td className="px-lg py-sm text-right">
                        {canRead ? (
                          <Link
                            to={`/absences/${fiche.userId}/${fiche.mois}/${fiche.annee}`}
                            className="font-label-md text-label-md text-primary hover:underline"
                          >
                            Voir le détail
                          </Link>
                        ) : (
                          <button
                            type="button"
                            title="Permission absence:read requise"
                            disabled
                            className="font-label-md text-label-md text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Voir le détail
                          </button>
                        )}
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
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} fiches
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={!hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!hasNextPage}
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
