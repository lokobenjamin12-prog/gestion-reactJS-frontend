import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAjouterJoursRetardMutation } from '../api/retards.queries';
import { MOIS_LABELS, formatPeriode } from '../lib/retardDisplay';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const CURRENT_YEAR = new Date().getFullYear();

interface DateRow {
  key: number;
  date: string;
  heureArrivee: string;
  estJustifie: boolean;
}

let nextKey = 1;

export function CreateRetardPage() {
  const navigate = useNavigate();
  const ajouterJoursMutation = useAjouterJoursRetardMutation();
  const { data: usersData } = useUsersQuery({ limit: 100 });

  const [userId, setUserId] = useState('');
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(CURRENT_YEAR);
  const [rows, setRows] = useState<DateRow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const errorRef = useScrollToError(ajouterJoursMutation.isError || !!validationError);
  const justifies = rows.filter((r) => r.estJustifie).length;

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey++, date: '', heureArrivee: '', estJustifie: false }]);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateRow(key: number, patch: Partial<DateRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleSubmit() {
    setValidationError(null);

    if (!userId) {
      setValidationError('Veuillez sélectionner un collaborateur.');
      return;
    }
    if (rows.length === 0) {
      setValidationError('Ajoutez au moins une date.');
      return;
    }
    if (rows.some((r) => !r.date)) {
      setValidationError('Chaque ligne doit avoir une date renseignée.');
      return;
    }
    const dates = rows.map((r) => r.date);
    if (new Set(dates).size !== dates.length) {
      setValidationError('Une même date ne peut pas être ajoutée deux fois.');
      return;
    }

    ajouterJoursMutation.mutate(
      {
        userId,
        mois,
        annee,
        jours: rows.map((r) => ({
          date: r.date,
          estJustifie: r.estJustifie,
          heureArrivee: r.heureArrivee || undefined,
        })),
      },
      { onSuccess: () => navigate(`/retards/${userId}/${mois}/${annee}`, { replace: true }) },
    );
  }

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/retards" className="hover:text-primary">
          Retards
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Nouveau</span>
      </nav>
      <h2 className="mb-xl font-headline-lg text-headline-lg text-primary">Ajouter des jours de retard</h2>

      <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container/20 p-md text-on-error-container">
        <Icon name="warning" className="mt-0.5 text-error" />
        <p className="font-body-sm text-body-sm">
          <strong>Règles de gestion des retards :</strong> l'ajout est impossible si le salaire du mois n'est pas
          encore initialisé, ou s'il est déjà clôturé. Un jour ne peut pas être à la fois un retard et une absence.
        </p>
      </div>

      {(ajouterJoursMutation.isError || validationError) && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">
            {validationError ?? getApiErrorMessage(ajouterJoursMutation.error)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-lg md:grid-cols-12">
        {/* Colonne gauche : contexte */}
        <div className="space-y-lg md:col-span-5">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg font-title-md text-title-md text-primary">Détails du retard</h3>
            <div className="space-y-md">
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Collaborateur
                </label>
                <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full">
                  <option value="">Sélectionner un collaborateur</option>
                  {usersData?.data.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Mois</label>
                  <Select value={mois} onChange={(e) => setMois(Number(e.target.value))} className="w-full">
                    {MOIS_LABELS.slice(1).map((label, i) => (
                      <option key={label} value={i + 1}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Année</label>
                  <input
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-md text-body-md outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-secondary-container p-lg">
            <h3 className="mb-md font-label-md text-label-md font-bold uppercase tracking-widest text-on-secondary-container">
              Résumé de la saisie
            </h3>
            <div className="space-y-md">
              <div className="flex items-end justify-between border-b border-on-secondary-container/10 pb-2">
                <span className="font-body-sm text-body-sm text-on-secondary-container">Total lignes</span>
                <span className="font-headline-lg text-headline-lg leading-none text-on-secondary-container">
                  {rows.length}
                </span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-secondary-container/70">Justifiés</span>
                <span className="font-bold text-on-secondary-container">{justifies}</span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-secondary-container/70">Mois de référence</span>
                <span className="font-bold text-on-secondary-container">{formatPeriode(mois, annee)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : sélection des dates */}
        <div className="md:col-span-7">
          <div className="flex min-h-[400px] flex-col rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="mb-lg flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-primary">Dates des retards</h3>
              <Button type="button" onClick={addRow}>
                <Icon name="add" className="text-[18px]" />
                Ajouter une date
              </Button>
            </div>

            <div className="flex-1 space-y-sm">
              {rows.length === 0 ? (
                <div className="py-xl text-center opacity-40">
                  <Icon name="event_busy" className="text-[48px]" />
                  <p className="mt-sm font-body-sm text-body-sm">Aucune date ajoutée pour le moment.</p>
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-12 items-center gap-md rounded-lg border border-transparent bg-surface-container p-md transition-all hover:border-outline-variant"
                  >
                    <div className="col-span-5">
                      <label className="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
                        Date
                      </label>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(row.key, { date: e.target.value })}
                        className="w-full border-none bg-transparent p-0 font-body-md text-body-md font-medium outline-none focus:ring-0"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
                        Heure (HH:MM)
                      </label>
                      <input
                        type="time"
                        value={row.heureArrivee}
                        onChange={(e) => updateRow(row.key, { heureArrivee: e.target.value })}
                        className="w-full border-none bg-transparent p-0 font-body-md text-body-md font-medium outline-none focus:ring-0"
                      />
                    </div>
                    <div className="col-span-3 flex flex-col items-center">
                      <label className="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
                        Justifié
                      </label>
                      <input
                        type="checkbox"
                        checked={row.estJustifie}
                        onChange={(e) => updateRow(row.key, { estJustifie: e.target.checked })}
                        className="h-5 w-5 accent-primary"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="rounded-full p-2 text-outline transition-colors hover:bg-error/5 hover:text-error"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-xl flex justify-end gap-md border-t border-outline-variant pt-lg">
              <Link to="/retards">
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </Link>
              <Button type="button" onClick={handleSubmit} disabled={ajouterJoursMutation.isPending}>
                {ajouterJoursMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  <>
                    <Icon name="save" className="text-[18px]" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
