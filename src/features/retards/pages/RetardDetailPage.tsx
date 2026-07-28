import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRetardQuery, useMettreAJourJourRetardMutation } from '../api/retards.queries';
import { AjouterJourDialog } from '../components/AjouterJourDialog';
import { SupprimerJourDialog } from '../components/SupprimerJourDialog';
import { formatPeriode, formatDateLong, countJours, formatRelativeTime } from '../lib/retardDisplay';
import { useUserQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function RetardDetailPage() {
  const { userId, mois, annee } = useParams<{ userId: string; mois: string; annee: string }>();
  const navigate = useNavigate();
  const moisNum = Number(mois);
  const anneeNum = Number(annee);

  const { data: fiche, isLoading, isError, error } = useRetardQuery(userId!, moisNum, anneeNum);
  const { data: user } = useUserQuery(userId!);
  const mettreAJourJourMutation = useMettreAJourJourRetardMutation();
  const canCreate = usePermission('retard:create');
  const canDelete = usePermission('retard:delete');
  const canUpdate = usePermission('retard:update');

  const [addingJour, setAddingJour] = useState(false);
  const [deletingJour, setDeletingJour] = useState<{ userId: string; date: string } | null>(null);
  const errorRef = useScrollToError(mettreAJourJourMutation.isError);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !fiche) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger cette fiche de retard.')}
      </div>
    );
  }

  const counts = countJours(fiche.jours);
  const joursTries = [...fiche.jours].sort((a, b) => a.date.localeCompare(b.date));

  const handleToggle = (date: string, current: boolean) => {
    mettreAJourJourMutation.mutate({ userId: fiche.userId, date, estJustifie: !current });
  };

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <nav className="flex items-center gap-xs font-label-sm text-label-sm text-outline">
          <Link to="/retards" className="hover:text-primary">
            Retards
          </Link>
          <span className="mx-1">/</span>
          <span>{fiche.user.firstName} {fiche.user.lastName}</span>
          <span className="mx-1">/</span>
          <span className="text-on-surface">{formatPeriode(fiche.mois, fiche.annee)}</span>
        </nav>
        <Button
          title={canCreate ? undefined : 'Permission retard:create requise'}
          disabled={!canCreate}
          onClick={() => setAddingJour(true)}
        >
          <Icon name="add" />
          Ajouter un jour
        </Button>
      </div>

      {mettreAJourJourMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(mettreAJourJourMutation.error)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-2">
          <div className="flex items-center gap-md">
            <Avatar
              firstName={fiche.user.firstName}
              lastName={fiche.user.lastName}
              src={fiche.user.profilePicture}
              className="h-14 w-14 border border-outline-variant font-bold"
            />
            <div>
              <span className="mb-1 block font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Collaborateur
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                {fiche.user.firstName} {fiche.user.lastName}
              </h2>
              <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                {user?.role.post ? `${user.role.post} • ` : ''}
                {formatPeriode(fiche.mois, fiche.annee)}
              </p>
            </div>
          </div>
          <div className="mt-xl flex items-center gap-xl">
            <div className="flex flex-col">
              <span className="font-display-lg text-display-lg text-error">{counts.injustifies}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                JOUR{counts.injustifies > 1 ? 'S' : ''} INJUSTIFIÉ{counts.injustifies > 1 ? 'S' : ''}
              </span>
            </div>
            <div className="h-12 w-px bg-outline-variant" />
            <div className="flex flex-col">
              <span className="font-display-lg text-display-lg text-primary">{counts.total}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                JOUR{counts.total > 1 ? 'S' : ''} AU TOTAL
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-primary/20 bg-primary-container p-lg text-on-primary-container">
          <div>
            <h3 className="mb-md font-title-md text-title-md font-bold">Compteurs du mois</h3>
            <div className="space-y-sm">
              <div className="flex items-center justify-between border-b border-on-primary-container/10 py-xs">
                <span className="font-body-sm text-body-sm">Justifiés</span>
                <span className="font-label-md text-title-md">
                  {String(counts.justifies).padStart(2, '0')} jour{counts.justifies > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-on-primary-container/10 py-xs">
                <span className="font-body-sm text-body-sm">Injustifiés</span>
                <span className="font-label-md text-title-md">
                  {String(counts.injustifies).padStart(2, '0')} jour{counts.injustifies > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between pt-sm">
                <span className="font-body-md text-body-md font-bold">Total retards</span>
                <span className="font-label-md text-headline-lg">{String(counts.total).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          <p className="mt-md font-label-sm text-label-sm italic opacity-70">
            Dernière mise à jour : {formatRelativeTime(fiche.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-lg flex items-end justify-between gap-md">
        <div>
          <h3 className="font-title-md text-title-md font-bold text-primary">Chronologie des retards</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Basculez le statut ou supprimez un jour de retard.
          </p>
        </div>
        <Button variant="outline" title="Bientôt disponible" disabled>
          <Icon name="file_download" className="text-[18px]" />
          Exporter PDF
        </Button>
      </div>

      <div className="mt-md overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant">Date</th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant">Heure d'arrivée</th>
              <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant">Statut</th>
              <th className="px-lg py-md text-right font-label-md text-label-md text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {joursTries.length === 0 ? (
              <tr>
                <td className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant" colSpan={4}>
                  Aucun retard enregistré pour ce mois.
                </td>
              </tr>
            ) : (
              joursTries.map((jour) => (
                <tr key={jour.date} className="group transition-colors hover:bg-surface-container">
                  <td className="px-lg py-md font-body-md text-body-md font-semibold capitalize text-on-surface">
                    {formatDateLong(jour.date)}
                  </td>
                  <td className="px-lg py-md font-label-md text-label-md text-on-surface-variant">
                    {jour.heureArrivee || '—'}
                  </td>
                  <td className="px-lg py-md">
                    <span
                      className={`inline-flex items-center gap-xs rounded-full px-sm py-xs font-label-md text-label-md ${
                        jour.estJustifie
                          ? 'border border-outline-variant bg-surface-container text-on-surface-variant'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${jour.estJustifie ? 'bg-emerald-500' : 'bg-error'}`} />
                      {jour.estJustifie ? 'Justifié' : 'Injustifié'}
                    </span>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-sm opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        title={canUpdate ? 'Basculer le statut' : 'Permission retard:update requise'}
                        disabled={!canUpdate}
                        onClick={() => handleToggle(jour.date, jour.estJustifie)}
                        className="rounded-lg p-xs text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="sync_alt" />
                      </button>
                      <button
                        type="button"
                        title={canDelete ? 'Supprimer' : 'Permission retard:delete requise'}
                        disabled={!canDelete}
                        onClick={() => setDeletingJour({ userId: fiche.userId, date: jour.date })}
                        className="rounded-lg p-xs text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AjouterJourDialog
        open={addingJour}
        userId={fiche.userId}
        mois={fiche.mois}
        annee={fiche.annee}
        onClose={() => setAddingJour(false)}
        onAdded={() => setAddingJour(false)}
      />

      <SupprimerJourDialog
        jour={deletingJour}
        onClose={() => setDeletingJour(null)}
        onDeleted={(isLastDay) => {
          setDeletingJour(null);
          if (isLastDay) navigate('/retards', { replace: true });
        }}
      />
    </>
  );
}
