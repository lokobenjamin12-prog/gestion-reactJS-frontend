import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSalairesListQuery } from '../api/salaires.queries';
import { formatPeriode, formatCurrency, MOIS_LABELS } from '../lib/salaireDisplay';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const CURRENT_YEAR = new Date().getFullYear();

export function SalairesListPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [mois, setMois] = useState<number | undefined>(undefined);
  const [annee, setAnnee] = useState<number | undefined>(undefined);
  const [estCloture, setEstCloture] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [userId, mois, annee, estCloture]);

  const { data, isLoading, isError, error } = useSalairesListQuery({
    userId,
    mois,
    annee,
    estCloture,
    page,
    limit: 10,
  });
  const { data: usersData } = useUsersQuery({ limit: 100 });
  const canCreate = usePermission('salaire:create');

  const fiches = data?.data ?? [];
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
            <span className="font-bold text-primary">Salaires</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Salaires</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Gestion de la paie mensuelle des collaborateurs.
          </p>
        </div>
        <div className="flex gap-md">
          <Link to="/salaires/masse-salariale">
            <Button variant="outline">
              <Icon name="insights" />
              Masse salariale
            </Button>
          </Link>
          {canCreate ? (
            <Link to="/salaires/new">
              <Button>
                <Icon name="add" />
                Initialiser un salaire
              </Button>
            </Link>
          ) : (
            <Button title="Permission salaire:create requise" disabled>
              <Icon name="add" />
              Initialiser un salaire
            </Button>
          )}
        </div>
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
          <div className="flex flex-col gap-xs">
            <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Statut</label>
            <Select
              value={estCloture === undefined ? '' : String(estCloture)}
              onChange={(e) => setEstCloture(e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">Tous</option>
              <option value="false">Ouvert</option>
              <option value="true">Clôturé</option>
            </Select>
          </div>
          {(userId || mois || annee || estCloture !== undefined) && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setUserId(undefined);
                setMois(undefined);
                setAnnee(undefined);
                setEstCloture(undefined);
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
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Salaire brut
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Déductions
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Primes
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Salaire net
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
                    <td className="px-lg py-md" colSpan={8}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={8}>
                    {getApiErrorMessage(error, 'Impossible de charger les fiches de salaire.')}
                  </td>
                </tr>
              ) : fiches.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={8}
                  >
                    Aucune fiche de salaire enregistrée pour ces critères.
                  </td>
                </tr>
              ) : (
                fiches.map((fiche) => (
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
                    <td className="px-lg py-sm font-body-sm text-body-sm text-on-surface">
                      {formatPeriode(fiche.mois, fiche.annee)}
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                      {formatCurrency(fiche.salaireBrut)}
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-error">
                      {Number(fiche.totalDeductions) > 0 ? `- ${formatCurrency(fiche.totalDeductions)}` : '—'}
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-primary-container">
                      {Number(fiche.totalPrimes) > 0 ? `+ ${formatCurrency(fiche.totalPrimes)}` : '—'}
                    </td>
                    <td className="px-lg py-sm">
                      <span className="font-title-md text-title-md font-bold text-primary">
                        {formatCurrency(fiche.salaireNet)}
                      </span>
                    </td>
                    <td className="px-lg py-sm">
                      {fiche.estCloture ? (
                        <span className="inline-flex items-center gap-xs rounded-lg bg-secondary-fixed px-sm py-1 font-label-sm text-label-sm uppercase text-on-secondary-fixed">
                          <Icon name="lock" filled className="text-[14px]" />
                          Clôturé
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-surface-container-highest px-sm py-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
                          Ouvert
                        </span>
                      )}
                    </td>
                    <td className="px-lg py-sm text-right">
                      <Link
                        to={`/salaires/${fiche.id}`}
                        className="font-label-md text-label-md text-primary hover:underline"
                      >
                        Voir le détail
                      </Link>
                    </td>
                  </tr>
                ))
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
                disabled={!meta.hasPreviousPage}
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
