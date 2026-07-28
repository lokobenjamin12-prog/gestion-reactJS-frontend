import { useArchiveUserMutation } from '../api/users.queries';
import type { User } from '../types/user.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface ArchiveUserDialogProps {
  user: User | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchiveUserDialog({ user, onClose, onArchived }: ArchiveUserDialogProps) {
  const archiveMutation = useArchiveUserMutation();

  const handleConfirm = () => {
    if (!user) return;
    archiveMutation.mutate(user.id, { onSuccess: onArchived });
  };

  return (
    <Modal open={!!user} onClose={onClose}>
      {user && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="archive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Confirmer l'archivage</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Utilisateur : <strong>{user.firstName} {user.lastName}</strong>
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
            <div className="rounded-r-lg border-l-4 border-error bg-error-container/30 p-md">
              <div className="flex gap-sm">
                <Icon name="warning" filled className="text-error" />
                <p className="font-body-sm text-body-sm font-medium leading-relaxed text-on-error-container">
                  L'archivage révoquera immédiatement toutes les sessions actives de cet utilisateur.
                </p>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Êtes-vous sûr de vouloir archiver cet utilisateur ? Une fois archivé, il ne pourra plus se connecter au
              back-office de Ndolecam.
            </p>

            {archiveMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(archiveMutation.error)}</p>
            )}

            <div className="flex items-center gap-sm rounded-lg bg-surface-container p-sm">
              <Icon name="info" className="text-sm text-on-surface-variant" />
              <p className="font-label-md text-label-md leading-tight text-on-surface-variant">
                Note : un utilisateur archivé peut être restauré ultérieurement.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={archiveMutation.isPending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={archiveMutation.isPending}>
              {archiveMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="inventory_2" className="text-sm" />
                  Archiver l'utilisateur
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
