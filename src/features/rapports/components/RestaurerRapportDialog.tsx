import { useRestaurerRapportMutation } from '../api/rapports.queries';
import { RAPPORT_TYPE_LABELS, formatPeriode } from '../lib/rapportDisplay';
import type { Rapport } from '../types/rapport.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface RestaurerRapportDialogProps {
  rapport: Rapport | null;
  onClose: () => void;
  onRestored: () => void;
}

export function RestaurerRapportDialog({ rapport, onClose, onRestored }: RestaurerRapportDialogProps) {
  const restaurerMutation = useRestaurerRapportMutation();

  const handleConfirm = () => {
    if (!rapport) return;
    restaurerMutation.mutate(rapport.id, { onSuccess: onRestored });
  };

  return (
    <Modal open={!!rapport} onClose={onClose}>
      {rapport && (
        <>
          <div className="flex items-start justify-between bg-primary/5 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name="unarchive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Restaurer le rapport</h3>
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
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ce rapport sortira de la corbeille et redeviendra visible comme actif dans l'historique. Le fichier
              physique ayant été supprimé lors de l'archivage, il devra être régénéré pour être à nouveau
              téléchargeable.
            </p>

            {restaurerMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(restaurerMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={restaurerMutation.isPending}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={restaurerMutation.isPending}>
              {restaurerMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="unarchive" className="text-sm" />
                  Restaurer le rapport
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
