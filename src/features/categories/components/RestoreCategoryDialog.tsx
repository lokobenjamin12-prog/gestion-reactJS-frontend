import { useRestoreCategoryMutation } from '../api/categories.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface RestoreCategoryDialogProps {
  category: { id: string; nomUnique: string } | null;
  onClose: () => void;
  onRestored: () => void;
}

export function RestoreCategoryDialog({ category, onClose, onRestored }: RestoreCategoryDialogProps) {
  const restoreMutation = useRestoreCategoryMutation();

  const handleConfirm = () => {
    if (!category) return;
    restoreMutation.mutate(category.id, { onSuccess: onRestored });
  };

  const handleClose = () => {
    restoreMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!category} onClose={handleClose}>
      {category && (
        <>
          <div className="flex items-start justify-between bg-primary/5 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name="unarchive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Restaurer le format</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Format : <strong>{category.nomUnique}</strong>
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
            <p className="font-body-md text-body-md text-on-surface-variant">
              La ligne de stock associée sera également restaurée. Impossible si l'article parent est encore
              archivé.
            </p>

            {restoreMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(restoreMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={restoreMutation.isPending}>
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
