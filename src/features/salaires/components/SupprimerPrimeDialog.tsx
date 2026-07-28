import { useSupprimerPrimeMutation } from '../api/salaires.queries';
import { formatCurrency } from '../lib/salaireDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface SupprimerPrimeDialogProps {
  salaireId: string;
  prime: { index: number; somme: number; raison: string } | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function SupprimerPrimeDialog({ salaireId, prime, onClose, onDeleted }: SupprimerPrimeDialogProps) {
  const supprimerPrimeMutation = useSupprimerPrimeMutation();

  const handleClose = () => {
    supprimerPrimeMutation.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!prime) return;
    supprimerPrimeMutation.mutate({ id: salaireId, index: prime.index }, { onSuccess: () => onDeleted() });
  };

  return (
    <Modal open={!!prime} onClose={handleClose}>
      {prime && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="delete" className="text-[28px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Supprimer cette prime ?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {prime.raison} — {formatCurrency(prime.somme)}
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

          <div className="space-y-md px-lg pb-lg pt-sm">
            {supprimerPrimeMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">
                {getApiErrorMessage(supprimerPrimeMutation.error)}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={supprimerPrimeMutation.isPending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={supprimerPrimeMutation.isPending}>
              {supprimerPrimeMutation.isPending ? (
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
