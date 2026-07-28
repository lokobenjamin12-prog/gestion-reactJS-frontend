import { useSupprimerJourRetardMutation } from '../api/retards.queries';
import { formatDateLong } from '../lib/retardDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface SupprimerJourDialogProps {
  jour: { userId: string; date: string } | null;
  onClose: () => void;
  onDeleted: (isLastDay: boolean) => void;
}

export function SupprimerJourDialog({ jour, onClose, onDeleted }: SupprimerJourDialogProps) {
  const supprimerJourMutation = useSupprimerJourRetardMutation();

  const handleClose = () => {
    supprimerJourMutation.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!jour) return;
    supprimerJourMutation.mutate(jour, {
      onSuccess: (result) => onDeleted(result === null),
    });
  };

  return (
    <Modal open={!!jour} onClose={handleClose}>
      {jour && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="delete" className="text-[28px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Supprimer ce jour ?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDateLong(jour.date)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Fermer"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="space-y-md px-lg pb-lg pt-sm">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ce jour de retard sera définitivement retiré de la fiche mensuelle.
            </p>
            {supprimerJourMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">
                {getApiErrorMessage(supprimerJourMutation.error)}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={supprimerJourMutation.isPending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={supprimerJourMutation.isPending}>
              {supprimerJourMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="delete" className="text-sm" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
