import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMasseSalarialeQuery } from '../api/salaires.queries';
import { MOIS_LABELS, formatCurrency } from '../lib/salaireDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Avatar } from '@/shared/ui/Avatar';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const CURRENT_YEAR = new Date().getFullYear();

export function MasseSalarialePage() {
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(CURRENT_YEAR);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useMasseSalarialeQuery({ mois, annee, page, limit: 10 });

  const agregats = data?.agregatsGlobaux;
  const entries = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/salaires" className="hover:text-primary">
              Salaires
            </Link>
            <span className="mx-1">/</span>
            <span className="text-on-surface">Masse salariale</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Masse salariale</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Vue d'ensemble financière de la paie pour une période donnée.
          </p>
        </div>
        <div className="flex items-end gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-low p-sm">
          <div className="flex flex-col gap-xs">
            <label className="px-xs font-label-sm text-[10px] uppercase text-on-surface-variant">Mois</label>
            <Select
              value={mois}
              onChange={(e) => {
                setMois(Number(e.target.value));
                setPage(1);
              }}
            >
              {MOIS_LABELS.slice(1).map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="px-xs font-label-sm text-[10px] uppercase text-on-surface-variant">Année</label>
            <input
              type="number"
              value={annee}
              onChange={(e) => {
                setAnnee(Number(e.target.value));
                setPage(1);
              }}
              className="w-24 rounded-lg border border-outline-variant bg-surface-container-lowest py-xs px-sm font-label-md text-label-md outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="mb-xl flex items-center gap-sm rounded-lg border border-secondary-container bg-secondary-container/30 px-md py-sm">
        <Icon name="info" className="text-on-secondary-container" />
        <p className="font-body-sm text-body-sm text-on-secondary-container">
          Basé uniquement sur les fiches de salaire déjà clôturées pour cette période.
        </p>
      </div>

      {isError ? (
        <p className="py-lg text-center font-body-sm text-body-sm text-error">
          {getApiErrorMessage(error, 'Impossible de charger la masse salariale.')}
        </p>
      ) : (
        <>
          {/* Cartes agrégats */}
          <div className="mb-xl grid grid-cols-1 gap-gutter md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-lg">
              <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Total brut</p>
              <p className="font-title-md text-title-md text-primary">
                {agregats ? formatCurrency(agregats.totalBrut) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-lg">
              <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Total déductions</p>
              <p className="font-title-md text-title-md text-error">
                {agregats ? formatCurrency(agregats.totalDeductions) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-lg">
              <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Total primes</p>
              <p className="font-title-md text-title-md text-primary">
                {agregats ? formatCurrency(agregats.totalPrimes) : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-primary-container p-lg shadow-sm">
              <p className="mb-xs font-label-md text-label-md text-on-primary-container/70">Total net</p>
              <p className="font-headline-lg text-title-lg text-white">
                {agregats ? formatCurrency(agregats.totalNet) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-lg">
              <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Total versé</p>
              <p className="font-title-md text-title-md text-primary">
                {agregats ? formatCurrency(agregats.totalVerse) : '—'}
              </p>
            </div>
            <div className="flex flex-col justify-between rounded-lg border border-outline-variant/30 bg-surface-container-low p-lg">
              <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Écart total</p>
              <div className="flex items-center gap-xs">
                <span className={`h-2 w-2 rounded-full ${!agregats || agregats.ecartTotal === 0 ? 'bg-emerald-500' : 'bg-error'}`} />
                <p className={`font-title-md text-title-md ${!agregats || agregats.ecartTotal === 0 ? 'text-emerald-600' : 'text-error'}`}>
                  {agregats ? formatCurrency(agregats.ecartTotal) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-outline-variant bg-surface-container-high">
                  <tr>
                    <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Collaborateur
                    </th>
                    <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Salaire brut
                    </th>
                    <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Déductions
                    </th>
                    <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Primes
                    </th>
                    <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Salaire net
                    </th>
                    <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface">
                      Montant versé
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-lg py-md" colSpan={6}>
                          <div className="h-5 animate-pulse rounded bg-surface-container" />
                        </td>
                      </tr>
                    ))
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant">
                          <Icon name="payments" className="mb-md text-[48px] opacity-20" />
                          <p className="font-title-md text-title-md">
                            Aucune fiche de salaire clôturée pour cette période.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-sm">
                            <Avatar
                              firstName={entry.user.firstName}
                              lastName={entry.user.lastName}
                              src={entry.user.profilePicture}
                              className="h-8 w-8 text-[10px] font-bold"
                            />
                            <div>
                              <p className="font-body-md text-body-md font-bold text-on-surface">
                                {entry.user.firstName} {entry.user.lastName}
                              </p>
                              {entry.user.role?.post && (
                                <p className="font-label-sm text-[10px] text-on-surface-variant">
                                  {entry.user.role.post}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md text-right font-body-sm text-body-sm font-medium">
                          {formatCurrency(entry.salaireBrut)}
                        </td>
                        <td className="px-lg py-md text-right font-body-sm text-body-sm text-error">
                          {formatCurrency(entry.totalDeductions)}
                        </td>
                        <td className="px-lg py-md text-right font-body-sm text-body-sm text-primary">
                          {formatCurrency(entry.totalPrimes)}
                        </td>
                        <td className="px-lg py-md text-right font-body-sm text-body-sm font-bold">
                          {formatCurrency(entry.salaireNet)}
                        </td>
                        <td className="px-lg py-md text-right font-body-sm text-body-sm font-bold text-primary">
                          {entry.montantVerse ? formatCurrency(entry.montantVerse) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.total > 0 && (
              <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface-container-low px-lg py-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Affichage de {rangeStart}-{rangeEnd} sur {meta.total} collaborateurs
                </span>
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-md p-xs transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Icon name="chevron_left" />
                  </button>
                  <span className="px-md font-label-md text-label-md text-on-surface">
                    Page <strong>{meta.page}</strong> sur <strong>{meta.pagesTotales}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={meta.page >= meta.pagesTotales}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md p-xs transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Icon name="chevron_right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
