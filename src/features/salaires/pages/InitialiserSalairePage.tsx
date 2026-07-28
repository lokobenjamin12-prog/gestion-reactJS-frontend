import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInitialiserSalaireMutation } from '../api/salaires.queries';
import { MOIS_LABELS } from '../lib/salaireDisplay';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const CURRENT_YEAR = new Date().getFullYear();

export function InitialiserSalairePage() {
  const navigate = useNavigate();
  const initialiserMutation = useInitialiserSalaireMutation();
  // Le backend rejette l'initialisation pour un employé inactif — UsersFilters n'a
  // pas de paramètre `active`, donc on filtre côté client après avoir exclu les archivés.
  const { data: usersData } = useUsersQuery({ estArchive: false, limit: 100 });
  const activeUsers = (usersData?.data ?? []).filter((u) => u.active);

  const [userId, setUserId] = useState('');
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(CURRENT_YEAR);

  const errorRef = useScrollToError(initialiserMutation.isError);

  function handleSubmit() {
    if (!userId) return;
    initialiserMutation.mutate(
      { userId, mois, annee },
      { onSuccess: (data) => navigate(`/salaires/${data.id}`, { replace: true }) },
    );
  }

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/salaires" className="hover:text-primary">
          Salaires
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Initialiser</span>
      </nav>
      <h2 className="mb-xs font-headline-lg text-headline-lg text-primary">Initialiser un salaire</h2>
      <p className="mb-xl max-w-2xl font-body-md text-body-md text-on-surface-variant">
        Génère une fiche de paie pour un collaborateur, à partir de son salaire de base actuel.
      </p>

      <div className="flex flex-1 items-center justify-center py-xl">
        <div className="w-full max-w-[32rem] rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
          {initialiserMutation.isError && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
            >
              <Icon name="error" className="mt-0.5 text-[20px]" />
              <p className="font-body-sm text-body-sm">{getApiErrorMessage(initialiserMutation.error)}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-lg"
            noValidate
          >
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                Collaborateur
              </label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-12 w-full">
                <option value="">Sélectionner un employé actif</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} — {u.role.nomRole}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  Mois
                </label>
                <Select value={mois} onChange={(e) => setMois(Number(e.target.value))} className="h-12 w-full">
                  {MOIS_LABELS.slice(1).map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-xs">
                <label className="block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  Année
                </label>
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                  className="h-12 w-full rounded-lg border border-outline bg-white px-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex gap-sm rounded-lg border border-outline-variant/50 bg-surface-container p-md">
              <Icon name="info" className="text-primary" />
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                Le salaire brut, le nombre de jours ouvrables et le prix journalier seront calculés automatiquement
                à partir de la fiche du collaborateur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-md pt-md">
              <Link to="/salaires">
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={!userId || initialiserMutation.isPending}>
                {initialiserMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  'Initialiser'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
