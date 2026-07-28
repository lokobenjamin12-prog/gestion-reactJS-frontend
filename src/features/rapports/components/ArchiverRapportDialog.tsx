import { useArchiverRapportMutation } from '../api/rapports.queries';
import { RAPPORT_TYPE_LABELS, formatPeriode } from '../lib/rapportDisplay';
import type { Rapport } from '../types/rapport.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface ArchiverRapportDialogProps {
  rapport: Rapport | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiverRapportDialog({ rapport, onClose, onArchived }: ArchiverRapportDialogProps) {
  const archiverMutation = useArchiverRapportMutation();

  const handleConfirm = () => {
    if (!rapport) return;
    archiverMutation.mutate(rapport.id, { onSuccess: onArchived });
  };

  return (
    <Modal open={!!rapport} onClose={onClose}>
      {rapport && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="archive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Confirmer l'archivage</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {RAPPORT_TYPE_LABELS[rapport.type]} — {formatPeriode(rapport.mois, rapport.annee)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Fermer"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="space-y-md px-lg pb-lg pt-sm">
            <div className="rounded-r-lg border-l-4 border-error bg-error-container/30 p-md">
              <div className="flex gap-sm">
                <Icon name="warning" filled className="text-error" />
                <p className="font-body-sm text-body-sm font-medium leading-relaxed text-on-error-container">
                  Le fichier physique de ce rapport sera immédiatement supprimé du serveur.
                </p>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Êtes-vous sûr de vouloir archiver ce rapport ? Il ne pourra plus être téléchargé tant qu'il n'aura pas
              été restauré.
            </p>

            {archiverMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(archiverMutation.error)}</p>
            )}

            <div className="flex items-center gap-sm rounded-lg bg-surface-container p-sm">
              <Icon name="info" className="text-sm text-on-surface-variant" />
              <p className="font-label-md text-label-md leading-tight text-on-surface-variant">
                Note : un rapport archivé reste visible dans l'historique et peut être restauré ultérieurement.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={archiverMutation.isPending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={archiverMutation.isPending}>
              {archiverMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="archive" className="text-sm" />
                  Archiver le rapport
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
