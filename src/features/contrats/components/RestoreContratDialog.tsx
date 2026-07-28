import { useRestoreContratMutation } from '../api/contrats.queries';
import type { Contrat } from '../types/contrat.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface RestoreContratDialogProps {
  contrat: Contrat | null;
  onClose: () => void;
  onRestored: () => void;
}

export function RestoreContratDialog({ contrat, onClose, onRestored }: RestoreContratDialogProps) {
  const restoreMutation = useRestoreContratMutation();

  const handleConfirm = () => {
    if (!contrat) return;
    restoreMutation.mutate(contrat.id, {
      onSuccess: onRestored,
    });
  };

  return (
    <Modal open={!!contrat} onClose={onClose}>
      {contrat && (
        <>
          <div className="flex items-start justify-between bg-primary/5 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name="unarchive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Restaurer le contrat</h3>
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
              Ce contrat redeviendra actif et sera de nouveau pris en compte dans les suivis RH (échéances,
              alertes CDD).
            </p>

            {restoreMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(restoreMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="unarchive" className="text-sm" />
                  Restaurer
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
