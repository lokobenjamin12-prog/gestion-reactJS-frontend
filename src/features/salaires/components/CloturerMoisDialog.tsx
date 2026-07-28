import { useCloturerMoisMutation } from '../api/salaires.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface CloturerMoisDialogProps {
  open: boolean;
  salaireId: string;
  onClose: () => void;
  onCloture: () => void;
}

export function CloturerMoisDialog({ open, salaireId, onClose, onCloture }: CloturerMoisDialogProps) {
  const cloturerMoisMutation = useCloturerMoisMutation();

  const handleClose = () => {
    cloturerMoisMutation.reset();
    onClose();
  };

  const handleConfirm = () => {
    cloturerMoisMutation.mutate(salaireId, { onSuccess: () => onCloture() });
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex items-start justify-between bg-error-container/10 p-lg">
        <div className="flex items-center gap-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
            <Icon name="lock" className="text-[28px]" />
          </div>
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">Clôturer le mois ?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Action irréversible</p>
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
          Les déductions d'absences et de retards seront calculées définitivement, et plus aucune prime ne pourra
          être ajoutée ou supprimée. Cette action ne peut pas être annulée.
        </p>
        {cloturerMoisMutation.isError && (
          <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(cloturerMoisMutation.error)}</p>
        )}
      </div>

      <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
        <Button variant="outline" onClick={handleClose} disabled={cloturerMoisMutation.isPending}>
          Annuler
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={cloturerMoisMutation.isPending}>
          {cloturerMoisMutation.isPending ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <>
              <Icon name="lock" className="text-sm" />
              Clôturer définitivement
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
