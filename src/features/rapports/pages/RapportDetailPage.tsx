import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRapportQuery, useTelechargerRapportMutation } from '../api/rapports.queries';
import { ArchiverRapportDialog } from '../components/ArchiverRapportDialog';
import { RestaurerRapportDialog } from '../components/RestaurerRapportDialog';
import { EXPORT_FORMAT_LABELS, RAPPORT_TYPE_LABELS, formatPeriode } from '../lib/rapportDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

// Texte de présentation dérivé du type réel (RapportType) — aucune donnée
// chiffrée, juste une phrase explicative fixe par type.
const TYPE_DESCRIPTIONS: Record<string, string> = {
  ABSENCES: "Détail des jours d'absence et de retard enregistrés sur la période sélectionnée.",
  MASSE_SALARIALE: 'Structure des coûts salariaux clôturés (brut, déductions, primes, net, montants versés) sur la période.',
  CONTRATS_CDD: 'Liste des contrats à durée déterminée arrivant à échéance dans les 90 jours suivant la génération.',
};

export function RapportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rapport, isLoading, isError, error } = useRapportQuery(id ?? '');
  const canDownload = usePermission('rapport:read');
  const canDelete = usePermission('rapport:delete');
  const canUpdate = usePermission('rapport:update');
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const telechargerMutation = useTelechargerRapportMutation();

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !rapport) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce rapport.')}
      </div>
    );
  }

  const cible = rapport.user ? `${rapport.user.firstName} ${rapport.user.lastName}` : 'Tous les collaborateurs';
  const peutTelecharger = canDownload && !!rapport.fichier;

  function handleDownload() {
    if (!rapport) return;
    telechargerMutation.mutate(rapport.id, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_${rapport.type.toLowerCase()}_${rapport.periode.replace('/', '-')}.${
          rapport.formatExport === 'PDF' ? 'pdf' : 'xlsx'
        }`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
    });
  }

  return (
    <>
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <Link to="/rapports" className="hover:text-primary">
          Rapports
        </Link>
        <span className="mx-1">/</span>
        <span className="text-on-surface">
          {RAPPORT_TYPE_LABELS[rapport.type]} — {formatPeriode(rapport.mois, rapport.annee)}
        </span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-end">
        <div className="space-y-sm">
          <div className="flex flex-wrap items-center gap-sm">
            <span className="rounded bg-primary px-sm py-xs font-label-md text-label-md uppercase tracking-widest text-on-primary">
              {RAPPORT_TYPE_LABELS[rapport.type]}
            </span>
            <span className="rounded border border-outline-variant px-sm py-xs font-label-md text-label-md uppercase text-on-surface-variant">
              {formatPeriode(rapport.mois, rapport.annee)}
            </span>
            {rapport.estArchive ? (
              <span className="flex items-center gap-xs rounded-full bg-outline-variant px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-on-surface-variant" />
                Archivé
              </span>
            ) : (
              <span className="flex items-center gap-xs rounded-full bg-secondary-container px-sm py-xs font-label-md text-label-md text-on-secondary-fixed-variant">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Actif
              </span>
            )}
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {RAPPORT_TYPE_LABELS[rapport.type]}
          </h2>
          <p className="max-w-[42rem] font-body-md text-body-md text-on-surface-variant">
            {TYPE_DESCRIPTIONS[rapport.type]}
          </p>
        </div>
        <div className="flex gap-md">
          <div className="group relative">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!peutTelecharger || telechargerMutation.isPending}
            >
              {telechargerMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <Icon name="download" />
              )}
              Télécharger
            </Button>
            {!peutTelecharger && (
              <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded bg-inverse-surface p-2 text-center font-label-sm text-label-sm text-inverse-on-surface shadow-lg group-hover:block">
                Fichier indisponible {rapport.estArchive ? '(rapport archivé)' : ''}
              </div>
            )}
          </div>
          {rapport.estArchive ? (
            <Button
              title={canUpdate ? 'Restaurer' : 'Permission rapport:update requise'}
              disabled={!canUpdate}
              onClick={() => setRestoring(true)}
            >
              <Icon name="unarchive" />
              Restaurer le rapport
            </Button>
          ) : (
            <Button
              variant="outline"
              title={canDelete ? 'Archiver' : 'Permission rapport:delete requise'}
              disabled={!canDelete}
              onClick={() => setArchiving(true)}
            >
              <Icon name="archive" />
              Archiver le rapport
            </Button>
          )}
        </div>
      </div>

      {telechargerMutation.isError && (
        <div
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(telechargerMutation.error)}</p>
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
        <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-primary">
          <Icon name="info" />
          Informations de génération
        </h3>
        <div className="grid grid-cols-1 gap-xl sm:grid-cols-2">
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Format du fichier</p>
            <div className="flex items-center gap-sm">
              <Icon
                name={rapport.formatExport === 'PDF' ? 'picture_as_pdf' : 'description'}
                className="text-primary"
              />
              <p className="font-body-md text-body-md font-bold text-on-surface">
                {EXPORT_FORMAT_LABELS[rapport.formatExport]}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Cible collaborateurs</p>
            <div className="flex items-center gap-sm">
              <Icon name="groups" className="text-primary" />
              <p className="font-body-md text-body-md font-bold text-on-surface">{cible}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Date de génération</p>
            <div className="flex items-center gap-sm">
              <Icon name="calendar_month" className="text-primary" />
              <p className="font-body-md text-body-md font-bold text-on-surface">
                {new Date(rapport.dateGeneration).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {rapport.estArchive && rapport.deletedAt && (
            <div className="space-y-1">
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Archivé le</p>
              <div className="flex items-center gap-sm">
                <Icon name="archive" className="text-primary" />
                <p className="font-body-md text-body-md font-bold text-on-surface">
                  {new Date(rapport.deletedAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ArchiverRapportDialog
        rapport={archiving ? rapport : null}
        onClose={() => setArchiving(false)}
        onArchived={() => setArchiving(false)}
      />
      <RestaurerRapportDialog
        rapport={restoring ? rapport : null}
        onClose={() => setRestoring(false)}
        onRestored={() => setRestoring(false)}
      />
    </>
  );
}
