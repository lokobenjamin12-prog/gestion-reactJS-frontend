import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAjouterJoursMutation } from '../api/absences.queries';
import { MOIS_LABELS } from '../lib/absenceDisplay';
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
  estJustifie: boolean;
}

let nextKey = 1;

export function CreateAbsencePage() {
  const navigate = useNavigate();
  const ajouterJoursMutation = useAjouterJoursMutation();
  const { data: usersData } = useUsersQuery({ limit: 100 });

  const [userId, setUserId] = useState('');
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(CURRENT_YEAR);
  const [rows, setRows] = useState<DateRow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const errorRef = useScrollToError(ajouterJoursMutation.isError || !!validationError);

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey++, date: '', estJustifie: false }]);
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
        jours: rows.map((r) => ({ date: r.date, estJustifie: r.estJustifie })),
      },
      { onSuccess: () => navigate(`/absences/${userId}/${mois}/${annee}`, { replace: true }) },
    );
  }

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/absences" className="hover:text-primary">
          Absences
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Nouveau</span>
      </nav>
      <h2 className="mb-xl font-headline-lg text-headline-lg text-primary">Ajouter des jours d'absence</h2>

      <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container/20 p-md text-on-error-container">
        <Icon name="warning" className="mt-0.5 text-error" />
        <p className="font-body-sm text-body-sm">
          <strong>Note d'avertissement :</strong> l'ajout est impossible si le salaire du mois n'est pas encore
          initialisé, ou s'il est déjà clôturé.
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
            <h3 className="mb-lg font-title-md text-title-md text-primary">Détails de la période</h3>
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

          <div className="rounded-xl border border-primary/10 bg-primary-container/5 p-lg">
            <div className="mb-sm flex items-center gap-sm">
              <Icon name="info" filled className="text-primary" />
              <h3 className="font-body-md font-semibold text-primary">Récapitulatif</h3>
            </div>
            <div className="flex justify-between border-b border-outline-variant/30 py-xs">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Jours sélectionnés</span>
              <span className="font-bold text-body-sm text-primary">{rows.length}</span>
            </div>
          </div>
        </div>

        {/* Colonne droite : sélection des dates */}
        <div className="md:col-span-7">
          <div className="flex min-h-[400px] flex-col rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="mb-lg flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-primary">Sélection des dates</h3>
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
                    className="flex items-center gap-md rounded-lg border border-transparent bg-surface-container p-md transition-all hover:border-outline-variant"
                  >
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.key, { date: e.target.value })}
                      className="flex-1 border-none bg-transparent p-0 font-body-md text-body-md font-medium outline-none focus:ring-0"
                    />
                    <label className="flex cursor-pointer select-none items-center gap-sm">
                      <input
                        type="checkbox"
                        checked={row.estJustifie}
                        onChange={(e) => updateRow(row.key, { estJustifie: e.target.checked })}
                        className="h-5 w-5 accent-primary"
                      />
                      <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
                        Justifiée
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="rounded-full p-2 text-outline transition-colors hover:bg-error/5 hover:text-error"
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-xl flex justify-end gap-md border-t border-outline-variant pt-lg">
              <Link to="/absences">
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
