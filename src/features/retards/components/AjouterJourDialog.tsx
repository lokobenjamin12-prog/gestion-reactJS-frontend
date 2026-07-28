import { useState } from 'react';
import { useAjouterJoursRetardMutation } from '../api/retards.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface AjouterJourDialogProps {
  open: boolean;
  userId: string;
  mois: number;
  annee: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AjouterJourDialog({ open, userId, mois, annee, onClose, onAdded }: AjouterJourDialogProps) {
  const ajouterJoursMutation = useAjouterJoursRetardMutation();
  const [date, setDate] = useState('');
  const [heureArrivee, setHeureArrivee] = useState('');
  const [estJustifie, setEstJustifie] = useState(false);

  const handleClose = () => {
    ajouterJoursMutation.reset();
    setDate('');
    setHeureArrivee('');
    setEstJustifie(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!date) return;
    ajouterJoursMutation.mutate(
      { userId, mois, annee, jours: [{ date, estJustifie, heureArrivee: heureArrivee || undefined }] },
      { onSuccess: () => onAdded() },
    );
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex items-start justify-between p-lg">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">Ajouter un jour de retard</h3>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            Le jour sera ajouté à la fiche du mois en cours.
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
        {ajouterJoursMutation.isError && (
          <div className="flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[20px]" />
            <p className="font-body-sm text-body-sm">{getApiErrorMessage(ajouterJoursMutation.error)}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-sm text-body-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            Heure d'arrivée (optionnel)
          </label>
          <input
            type="time"
            value={heureArrivee}
            onChange={(e) => setHeureArrivee(e.target.value)}
            className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-sm text-body-sm outline-none focus:border-primary"
          />
        </div>

        <label className="flex items-center gap-sm">
          <input
            type="checkbox"
            checked={estJustifie}
            onChange={(e) => setEstJustifie(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="font-body-sm text-body-sm text-on-surface">Retard justifié</span>
        </label>
      </div>

      <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
        <Button variant="outline" onClick={handleClose} disabled={ajouterJoursMutation.isPending}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!date || ajouterJoursMutation.isPending}>
          {ajouterJoursMutation.isPending ? (
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
