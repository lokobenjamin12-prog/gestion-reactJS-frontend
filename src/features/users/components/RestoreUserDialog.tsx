import { useRestoreUserMutation } from '../api/users.queries';
import type { User } from '../types/user.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface RestoreUserDialogProps {
  user: User | null;
  onClose: () => void;
  onRestored: () => void;
}

export function RestoreUserDialog({ user, onClose, onRestored }: RestoreUserDialogProps) {
  const restoreMutation = useRestoreUserMutation();

  const handleConfirm = () => {
    if (!user) return;
    restoreMutation.mutate(user.id, { onSuccess: onRestored });
  };

  return (
    <Modal open={!!user} onClose={onClose}>
      {user && (
        <>
          <div className="flex items-start justify-between bg-primary/5 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon name="unarchive" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Restaurer l'utilisateur</h3>
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
            <p className="font-body-md text-body-md text-on-surface-variant">
              Cet utilisateur pourra à nouveau se connecter au back-office de Ndolecam. Aucune session n'est
              rétablie automatiquement — une reconnexion manuelle sera nécessaire.
            </p>

            {restoreMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(restoreMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="unarchive" className="text-sm" />
                  Restaurer l'utilisateur
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
