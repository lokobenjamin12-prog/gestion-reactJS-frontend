import { useDeleteCategoryMutation } from '../api/categories.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface DeleteCategoryDialogProps {
  category: { id: string; nomUnique: string } | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteCategoryDialog({ category, onClose, onDeleted }: DeleteCategoryDialogProps) {
  const deleteMutation = useDeleteCategoryMutation();

  const handleConfirm = () => {
    if (!category) return;
    deleteMutation.mutate(category.id, { onSuccess: onDeleted });
  };

  const handleClose = () => {
    deleteMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!category} onClose={handleClose}>
      {category &&
        (deleteMutation.isError ? (
          <>
            <div className="flex items-start justify-between p-lg">
              <div className="flex items-center gap-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-outline">
                  <Icon name="error_outline" className="text-[28px]" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">Suppression impossible</h3>
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
              <div className="rounded-lg border border-error-container bg-error-container/30 p-md">
                <p className="font-body-md text-body-md leading-relaxed text-on-error-container">
                  {getApiErrorMessage(deleteMutation.error, `Le format "${category.nomUnique}" ne peut pas être supprimé.`)}
                </p>
              </div>
              <p className="font-body-sm italic text-body-sm text-on-surface-variant">
                Utilisez l'archivage à la place si ce format a un historique de mouvements de stock.
              </p>
            </div>

            <div className="flex justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg">
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between bg-error-container/10 p-lg">
              <div className="flex items-center gap-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                  <Icon name="delete" className="text-[32px]" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">Supprimer définitivement</h3>
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
                Cette action est irréversible et supprime le format et sa ligne de stock de la base de données.
              </p>
            </div>

            <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
              <Button variant="outline" onClick={handleClose} disabled={deleteMutation.isPending}>
                Annuler
              </Button>
              <Button variant="danger" onClick={handleConfirm} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  <>
                    <Icon name="delete" className="text-sm" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </div>
          </>
        ))}
    </Modal>
  );
}
