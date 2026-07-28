import { useArchiveCategoryMutation } from '../api/categories.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface ArchiveCategoryDialogProps {
  category: { id: string; nomUnique: string } | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiveCategoryDialog({ category, onClose, onArchived }: ArchiveCategoryDialogProps) {
  const archiveMutation = useArchiveCategoryMutation();

  const handleConfirm = () => {
    if (!category) return;
    archiveMutation.mutate(category.id, { onSuccess: onArchived });
  };

  const handleClose = () => {
    archiveMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!category} onClose={handleClose}>
      {category && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="archive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Archiver le format</h3>
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
              La ligne de stock associée à ce format sera également archivée.
            </p>

            {archiveMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(archiveMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={archiveMutation.isPending}>
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
