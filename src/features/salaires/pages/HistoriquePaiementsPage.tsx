import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useHistoriquePaiementsQuery } from '../api/salaires.queries';
import { formatPeriode, formatCurrency, MOIS_LABELS } from '../lib/salaireDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

function useTriState() {
  return {
    fromValue: (v: string): boolean | undefined => (v === '' ? undefined : v === 'true'),
    toValue: (v: boolean | undefined): string => (v === undefined ? '' : String(v)),
  };
}

export function HistoriquePaiementsPage() {
  const { userId } = useParams<{ userId: string }>();
  const tri = useTriState();

  const [annee, setAnnee] = useState<number | undefined>(undefined);
  const [mois, setMois] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [montantMinimum, setMontantMinimum] = useState<number | undefined>(undefined);
  const [montantMaximum, setMontantMaximum] = useState<number | undefined>(undefined);
  const [avecEcart, setAvecEcart] = useState<boolean | undefined>(undefined);
  const [avecFiche, setAvecFiche] = useState<boolean | undefined>(undefined);
  const [ficheSigne, setFicheSigne] = useState<boolean | undefined>(undefined);
  const [dateClotureDebut, setDateClotureDebut] = useState('');
  const [dateClotureFin, setDateClotureFin] = useState('');

  const { data, isLoading, isError, error } = useHistoriquePaiementsQuery(userId!, {
    annee,
    mois,
    page,
    limit: 10,
    montantMinimum,
    montantMaximum,
    avecEcart,
    avecFiche,
    ficheSigne,
    dateClotureDebut: dateClotureDebut || undefined,
    dateClotureFin: dateClotureFin || undefined,
  });

  const agregats = data?.agregats;
  const entries = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  if (isError) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, "Impossible de charger l'historique des paiements.")}
      </div>
    );
  }

  return (
    <>
      <nav className="mb-md flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[14px]" />
        <Link to="/salaires" className="hover:text-primary">
          Salaires
        </Link>
        <Icon name="chevron_right" className="text-[14px]" />
        <span className="font-bold text-on-surface">Historique des paiements</span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div className="flex items-center gap-lg">
          {data ? (
            <Avatar
              firstName={data.employe.firstName}
              lastName={data.employe.lastName}
              src={data.employe.profilePicture}
              rounded="xl"
              className="h-16 w-16 text-[24px]"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-[24px] font-bold text-white">
              —
            </div>
          )}
          <div>
            <h2 className="mb-1 font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Historique des paiements
            </h2>
            {data && (
              <div className="flex items-center gap-md">
                <span className="font-title-md text-title-md font-bold text-primary">
                  {data.employe.firstName} {data.employe.lastName}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{data.employe.email}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" title="Bientôt disponible" disabled>
          <Icon name="download" className="text-[18px]" />
          Exporter CSV
        </Button>
      </div>

      {/* Agrégats */}
      <div className="mb-xl grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total paiements
          </p>
          <p className="text-[24px] font-bold text-primary">{agregats?.totalPaiements ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total versé
          </p>
          <p className="text-[24px] font-bold text-primary">
            {agregats ? formatCurrency(agregats.totalVerse) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total net
          </p>
          <p className="text-[24px] font-bold text-primary">{agregats ? formatCurrency(agregats.totalNet) : '—'}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total déductions
          </p>
          <p className="text-[24px] font-bold text-error">
            {agregats ? formatCurrency(agregats.totalDeductions) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Total primes
          </p>
          <p className="text-[24px] font-bold text-secondary">
            {agregats ? formatCurrency(agregats.totalPrimes) : '—'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-lg overflow-hidden rounded-xl border border-outline-variant bg-white">
        <div className="flex flex-wrap items-center justify-between gap-md border-b border-outline-variant/50 p-md">
          <div className="flex items-center gap-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Année</label>
              <input
                type="number"
                value={annee ?? ''}
                onChange={(e) => resetPageAnd(setAnnee)(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Toutes"
                className="w-32 rounded border border-outline px-md py-1.5 font-body-sm text-body-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Mois</label>
              <Select
                value={mois ?? ''}
                onChange={(e) => resetPageAnd(setMois)(e.target.value ? Number(e.target.value) : undefined)}
                className="w-40"
              >
                <option value="">Tous les mois</option>
                {MOIS_LABELS.slice(1).map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-sm rounded bg-secondary-container px-md py-2 font-label-md text-label-md text-on-secondary-container transition-colors hover:bg-secondary-container/80"
          >
            <Icon name="filter_list" className="text-[18px]" />
            Filtres avancés
            <Icon name={showAdvanced ? 'expand_less' : 'expand_more'} className="text-[18px]" />
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-lg bg-surface-container-lowest p-lg md:grid-cols-4">
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Montant min/max</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={montantMinimum ?? ''}
                  onChange={(e) =>
                    resetPageAnd(setMontantMinimum)(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full rounded border border-outline px-md py-1.5 font-body-sm text-body-sm outline-none focus:border-primary"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={montantMaximum ?? ''}
                  onChange={(e) =>
                    resetPageAnd(setMontantMaximum)(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full rounded border border-outline px-md py-1.5 font-body-sm text-body-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Avec écart</label>
              <Select
                value={tri.toValue(avecEcart)}
                onChange={(e) => resetPageAnd(setAvecEcart)(tri.fromValue(e.target.value))}
                className="w-full"
              >
                <option value="">Tous</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </Select>
            </div>
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Fiche générée / signée</label>
              <div className="flex gap-2">
                <Select
                  value={tri.toValue(avecFiche)}
                  onChange={(e) => resetPageAnd(setAvecFiche)(tri.fromValue(e.target.value))}
                  className="w-full"
                >
                  <option value="">Fiche : Tous</option>
                  <option value="true">Générée</option>
                  <option value="false">Non générée</option>
                </Select>
                <Select
                  value={tri.toValue(ficheSigne)}
                  onChange={(e) => resetPageAnd(setFicheSigne)(tri.fromValue(e.target.value))}
                  className="w-full"
                >
                  <option value="">Signée : Tous</option>
                  <option value="true">Signée</option>
                  <option value="false">Non signée</option>
                </Select>
              </div>
            </div>
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Clôturé entre...</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateClotureDebut}
                  onChange={(e) => resetPageAnd(setDateClotureDebut)(e.target.value)}
                  className="w-full rounded border border-outline px-md py-1.5 font-body-sm text-body-sm outline-none focus:border-primary"
                />
                <input
                  type="date"
                  value={dateClotureFin}
                  onChange={(e) => resetPageAnd(setDateClotureFin)(e.target.value)}
                  className="w-full rounded border border-outline px-md py-1.5 font-body-sm text-body-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-high">
                <th className="px-md py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Période
                </th>
                <th className="px-md py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Salaire brut
                </th>
                <th className="px-md py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Déductions
                </th>
                <th className="px-md py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Primes
                </th>
                <th className="px-md py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Salaire net
                </th>
                <th className="px-md py-4 text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Montant versé
                </th>
                <th className="px-md py-4 text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Écart
                </th>
                <th className="px-md py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Fiche de paie
                </th>
                <th className="px-md py-4 text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-md py-4" colSpan={9}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-md py-xl text-center font-body-sm text-body-sm text-on-surface-variant">
                    Aucun paiement ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-surface-container-lowest">
                    <td className="px-md py-4 font-body-md text-body-md font-semibold">
                      {formatPeriode(entry.mois, entry.annee)}
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md">
                      {formatCurrency(entry.salaireBrut)}
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md text-error">
                      {formatCurrency(entry.totalDeductions)}
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md text-secondary">
                      {formatCurrency(entry.totalPrimes)}
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md font-bold">
                      {formatCurrency(entry.salaireNet)}
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md font-bold text-primary">
                      {formatCurrency(entry.montantVerse)}
                    </td>
                    <td className="px-md py-4 text-center">
                      {entry.aEcart ? (
                        <span className="rounded bg-error-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-error-container">
                          {formatCurrency(entry.ecart)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-md py-4">
                      {entry.ficheDePaie ? (
                        <div className="flex items-center gap-xs">
                          <span className="rounded bg-secondary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-secondary-fixed-variant">
                            Générée
                          </span>
                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                              entry.ficheDePaie.signeeParUser
                                ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                : 'border-amber-200 bg-amber-100 text-amber-800'
                            }`}
                          >
                            {entry.ficheDePaie.signeeParUser ? 'Signée' : 'Non signée'}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded bg-surface-variant px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                          Non générée
                        </span>
                      )}
                    </td>
                    <td className="px-md py-4 text-center">
                      <Link
                        to={`/salaires/${entry.id}`}
                        title="Voir la fiche"
                        className="text-on-surface-variant transition-colors hover:text-primary"
                      >
                        <Icon name="visibility" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-md border-t border-outline-variant bg-surface-container-lowest p-md sm:flex-row">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Affichage <strong className="text-on-surface">{rangeStart}-{rangeEnd}</strong> sur{' '}
              <strong className="text-on-surface">{meta.total}</strong> paiements
            </p>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-outline-variant px-md py-2 font-label-md text-label-md transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="font-label-md text-label-md">
                Page <strong>{meta.page}</strong> sur {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-outline-variant px-md py-2 font-label-md text-label-md transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
