import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useContratQuery } from '../api/contrats.queries';
import { ArchiveContratDialog } from '../components/ArchiveContratDialog';
import { RestoreContratDialog } from '../components/RestoreContratDialog';
import { formatDate, getContratStatusBadge, getTypeBadgeClass } from '../lib/contratDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function ContratDetailPage() {
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contrat, isLoading, isError, error } = useContratQuery(id!);
  const canUpdate = usePermission('contrat:update');
  const canDelete = usePermission('contrat:delete');
  const canRestore = usePermission('contrat:restore');
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !contrat) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce contrat.')}
      </div>
    );
  }

  const statusBadge = getContratStatusBadge(contrat);
  const canModify = canUpdate && contrat.type === 'CDD';
  const modifyDisabledReason = !canUpdate
    ? 'Permission contrat:update requise'
    : contrat.type === 'CDI'
      ? 'Un CDI ne peut pas être modifié'
      : undefined;

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/contrats" className="hover:text-primary">
              Contrats
            </Link>
            <span className="mx-1">/</span>
            <span className="text-on-surface">Détail</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">
            Contrat {contrat.type} — {contrat.user.firstName} {contrat.user.lastName}
          </h2>
        </div>
        <div className="flex gap-md">
          {contrat.deletedAt ? (
            <Button
              title={canRestore ? 'Restaurer' : 'Permission contrat:restore requise'}
              disabled={!canRestore}
              onClick={() => setRestoring(true)}
            >
              <Icon name="unarchive" />
              Restaurer
            </Button>
          ) : (
            <>
              {canModify ? (
                <Link to={`/contrats/${contrat.id}/edit`}>
                  <Button variant="outline">
                    <Icon name="edit" />
                    Modifier
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" title={modifyDisabledReason} disabled>
                  <Icon name="edit" />
                  Modifier
                </Button>
              )}
              <Button
                variant="danger"
                title={canDelete ? 'Archiver' : 'Permission contrat:delete requise'}
                disabled={!canDelete}
                onClick={() => setArchiving(true)}
              >
                <Icon name="archive" />
                Archiver
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        {/* Colonne principale */}
        <section className="col-span-12 space-y-lg lg:col-span-8">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="mb-lg flex items-center justify-between">
              <h3 className="flex items-center gap-sm font-title-md text-title-md text-on-surface">
                <Icon name="description" className="text-primary" />
                Informations du contrat
              </h3>
              <span className={`rounded-full px-md py-xs font-label-md text-label-md ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Type de contrat
                </label>
                <div className="flex items-center gap-sm">
                  <span className={`rounded-lg px-md py-sm font-title-md text-title-md ${getTypeBadgeClass(contrat.type)}`}>
                    {contrat.type}
                  </span>
                  <p className="font-body-md text-body-md text-on-surface">
                    {contrat.type === 'CDI' ? 'Contrat à Durée Indéterminée' : 'Contrat à Durée Déterminée'}
                  </p>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Date de début
                </label>
                <p className="font-title-md text-title-md text-on-surface">{formatDate(contrat.dateDebut)}</p>
              </div>
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Date de fin
                </label>
                <p
                  className={`font-title-md text-title-md ${contrat.dateFin ? 'text-on-surface' : 'italic text-on-surface-variant'}`}
                >
                  {contrat.dateFin ? formatDate(contrat.dateFin) : 'Aucune — CDI'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="history" className="text-primary" />
              Historique des alertes
            </h3>
            {contrat.alertes.length === 0 ? (
              <div className="flex flex-col items-center gap-sm py-xl text-on-surface-variant">
                <Icon name="notifications_off" className="text-[40px]" />
                <p className="font-body-md text-body-md">Aucune alerte envoyée</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-outline-variant">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-container-high">
                    <tr>
                      <th className="border-b border-outline-variant p-md font-label-md text-label-md text-on-surface-variant">
                        Alerte
                      </th>
                      <th className="border-b border-outline-variant p-md font-label-md text-label-md text-on-surface-variant">
                        Type de rappel
                      </th>
                      <th className="border-b border-outline-variant p-md font-label-md text-label-md text-on-surface-variant">
                        Date d'envoi
                      </th>
                      <th className="border-b border-outline-variant p-md font-label-md text-label-md text-on-surface-variant">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrat.alertes.map((alerte) => (
                      <tr key={alerte.id} className="transition-colors hover:bg-surface-container">
                        <td className="border-b border-outline-variant p-md">
                          <div className="flex items-center gap-md">
                            <Icon
                              name="notifications_active"
                              className={alerte.estEnvoyee ? 'text-on-tertiary-container' : 'text-outline'}
                            />
                            <span className="font-body-md text-body-md text-on-surface">
                              Expiration du contrat CDD
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-outline-variant p-md font-label-md text-label-md text-on-surface-variant">
                          J-{alerte.delaiJours}
                        </td>
                        <td className="border-b border-outline-variant p-md font-body-sm text-body-sm text-on-surface">
                          {alerte.envoyeeAt ? formatDate(alerte.envoyeeAt) : '—'}
                        </td>
                        <td className="border-b border-outline-variant p-md">
                          {alerte.estEnvoyee ? (
                            <div className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
                              <Icon name="check_circle" className="text-[16px]" />
                              Envoyé
                            </div>
                          ) : (
                            <div className="flex items-center gap-xs font-label-sm text-label-sm text-outline">
                              <Icon name="schedule" className="text-[16px]" />
                              Planifiée
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Colonne latérale */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
            <h3 className="mb-lg flex w-full items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="person" className="text-primary" />
              Collaborateur
            </h3>
            <Avatar
              firstName={contrat.user.firstName}
              lastName={contrat.user.lastName}
              src={contrat.user.profilePicture}
              className="mb-md h-24 w-24 border-4 border-surface-container-highest text-2xl shadow-sm"
            />
            <h4 className="mb-xl font-headline-lg text-headline-lg text-on-surface">
              {contrat.user.firstName} {contrat.user.lastName}
            </h4>
            <div className="mb-xl w-full space-y-sm">
              <div className="flex items-center gap-md rounded-lg border border-outline-variant bg-surface p-sm">
                <Icon name="mail" className="text-outline" />
                <span className="truncate font-label-md text-label-md text-on-surface">{contrat.user.email}</span>
              </div>
            </div>
            <Link
              to={`/users/${contrat.user.id}`}
              className="mt-auto flex items-center justify-center gap-sm font-bold text-primary hover:underline"
            >
              Voir la fiche utilisateur
              <Icon name="arrow_forward" />
            </Link>
          </div>
        </aside>
      </div>

      <ArchiveContratDialog
        contrat={archiving ? contrat : null}
        onClose={() => setArchiving(false)}
        onArchived={() => navigate('/contrats', { replace: true })}
      />
      <RestoreContratDialog
        contrat={restoring ? contrat : null}
        onClose={() => setRestoring(false)}
        onRestored={() => setRestoring(false)}
      />
    </>
  );
}
