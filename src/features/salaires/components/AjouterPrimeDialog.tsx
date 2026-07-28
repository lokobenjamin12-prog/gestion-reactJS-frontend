import { useState } from 'react';
import { useAjouterPrimeMutation } from '../api/salaires.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface AjouterPrimeDialogProps {
  open: boolean;
  salaireId: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AjouterPrimeDialog({ open, salaireId, onClose, onAdded }: AjouterPrimeDialogProps) {
  const ajouterPrimeMutation = useAjouterPrimeMutation();
  const [somme, setSomme] = useState('');
  const [raison, setRaison] = useState('');

  const handleClose = () => {
    ajouterPrimeMutation.reset();
    setSomme('');
    setRaison('');
    onClose();
  };

  const handleSubmit = () => {
    const montant = Number(somme);
    if (!montant || montant <= 0 || raison.trim().length < 3) return;
    ajouterPrimeMutation.mutate(
      { id: salaireId, payload: { somme: montant, raison: raison.trim() } },
      { onSuccess: () => onAdded() },
    );
  };

  const isValid = Number(somme) > 0 && raison.trim().length >= 3;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex items-start justify-between p-lg">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">Ajouter une prime</h3>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            Vient s'ajouter au salaire net de ce mois.
          </p>
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
        {ajouterPrimeMutation.isError && (
          <div className="flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[20px]" />
            <p className="font-body-sm text-body-sm">{getApiErrorMessage(ajouterPrimeMutation.error)}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            Montant (FCFA)
          </label>
          <input
            type="number"
            min="1"
            value={somme}
            onChange={(e) => setSomme(e.target.value)}
            className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-sm text-body-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Raison</label>
          <input
            type="text"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            placeholder="Ex: Prime de performance"
            className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-sm text-body-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
        <Button variant="outline" onClick={handleClose} disabled={ajouterPrimeMutation.isPending}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || ajouterPrimeMutation.isPending}>
          {ajouterPrimeMutation.isPending ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <>
              <Icon name="add" />
              Ajouter
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
