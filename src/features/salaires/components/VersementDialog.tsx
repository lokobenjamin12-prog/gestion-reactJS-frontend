import { useEnregistrerVersementMutation } from '../api/salaires.queries';
import { formatCurrency } from '../lib/salaireDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface VersementDialogProps {
  open: boolean;
  salaireId: string;
  salaireNet: string;
  onClose: () => void;
  onConfirmed: () => void;
}

export function VersementDialog({ open, salaireId, salaireNet, onClose, onConfirmed }: VersementDialogProps) {
  const enregistrerVersementMutation = useEnregistrerVersementMutation();

  const handleClose = () => {
    enregistrerVersementMutation.reset();
    onClose();
  };

  const handleConfirm = () => {
    enregistrerVersementMutation.mutate(
      { id: salaireId, payload: { montantVerse: Number(salaireNet) } },
      { onSuccess: () => onConfirmed() },
    );
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex items-start justify-between p-lg">
        <div className="flex items-center gap-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name="payments" className="text-[28px]" />
          </div>
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">Confirmer le versement</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Confirme que le virement a bien été effectué.
            </p>
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

      <div className="space-y-md px-lg pb-lg">
        <div className="rounded-lg bg-surface-container p-lg text-center">
          <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            Montant à verser
          </p>
          <p className="mt-xs font-headline-lg text-headline-lg text-primary">{formatCurrency(salaireNet)}</p>
        </div>
        <p className="font-body-sm text-body-sm italic text-on-surface-variant">
          Le montant versé doit correspondre exactement au salaire net calculé — il n'est pas modifiable ici.
        </p>
        {enregistrerVersementMutation.isError && (
          <p className="font-body-sm text-body-sm text-error">
            {getApiErrorMessage(enregistrerVersementMutation.error)}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
        <Button variant="outline" onClick={handleClose} disabled={enregistrerVersementMutation.isPending}>
          Annuler
        </Button>
        <Button onClick={handleConfirm} disabled={enregistrerVersementMutation.isPending}>
          {enregistrerVersementMutation.isPending ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <>
              <Icon name="check" />
              Confirmer le versement
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
