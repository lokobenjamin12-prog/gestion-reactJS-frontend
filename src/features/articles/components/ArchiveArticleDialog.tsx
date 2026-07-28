import { useArchiveArticleMutation } from '../api/articles.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface ArchiveArticleDialogProps {
  article: { id: string; nom: string } | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiveArticleDialog({ article, onClose, onArchived }: ArchiveArticleDialogProps) {
  const archiveMutation = useArchiveArticleMutation();

  const handleConfirm = () => {
    if (!article) return;
    archiveMutation.mutate(article.id, { onSuccess: onArchived });
  };

  const handleClose = () => {
    archiveMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!article} onClose={handleClose}>
      {article &&
        (archiveMutation.isError ? (
          <>
            <div className="flex items-start justify-between p-lg">
              <div className="flex items-center gap-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-outline">
                  <Icon name="error_outline" className="text-[28px]" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">Archivage impossible</h3>
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
                  {getApiErrorMessage(archiveMutation.error, `L'article "${article.nom}" ne peut pas être archivé.`)}
                </p>
              </div>
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
                  <Icon name="archive" className="text-[32px]" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">Archiver l'article</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Article : <strong>{article.nom}</strong>
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
                Tous les formats et lignes de stock de cet article seront également archivés. L'opération est
                bloquée si une quantité en stock est encore présente (tous formats confondus).
              </p>
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
        ))}
    </Modal>
  );
}
