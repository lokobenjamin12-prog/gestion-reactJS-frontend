import { useArchiveContratMutation } from '../api/contrats.queries';
import type { Contrat } from '../types/contrat.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface ArchiveContratDialogProps {
  contrat: Contrat | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiveContratDialog({ contrat, onClose, onArchived }: ArchiveContratDialogProps) {
  const archiveMutation = useArchiveContratMutation();

  const handleConfirm = () => {
    if (!contrat) return;
    archiveMutation.mutate(contrat.id, { onSuccess: onArchived });
  };

  return (
    <Modal open={!!contrat} onClose={onClose}>
      {contrat && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="archive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Archiver le contrat</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {contrat.type} — <strong>{contrat.user.firstName} {contrat.user.lastName}</strong>
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
            <p className="font-body-md text-body-md text-on-surface-variant">
              Êtes-vous sûr de vouloir archiver ce contrat ? Il ne sera plus considéré comme actif.
            </p>

            {archiveMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(archiveMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={archiveMutation.isPending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={archiveMutation.isPending}>
              {archiveMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="archive" className="text-sm" />
                  Archiver
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
