import { Link } from 'react-router-dom';
import { useDeleteRoleMutation } from '../api/roles.queries';
import type { RoleWithRelations } from '../types/role.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface DeleteRoleDialogProps {
  role: RoleWithRelations | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteRoleDialog({ role, onClose, onDeleted }: DeleteRoleDialogProps) {
  const deleteMutation = useDeleteRoleMutation();

  const handleConfirm = () => {
    if (!role) return;
    deleteMutation.mutate(role.id, { onSuccess: onDeleted });
  };

  const handleClose = () => {
    deleteMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!role} onClose={handleClose}>
      {role &&
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
                  Le rôle <strong>"{role.post}"</strong>{' '}
                  {getApiErrorMessage(deleteMutation.error, 'ne peut pas être supprimé.')}
                </p>
                {role.users.length > 0 && (
                  <Link
                    to={`/users?roleId=${role.id}`}
                    className="mt-sm inline-flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
                  >
                    Voir les utilisateurs concernés
                    <Icon name="open_in_new" className="text-[14px]" />
                  </Link>
                )}
              </div>
              <p className="font-body-sm italic text-body-sm text-on-surface-variant">
                Veuillez réassigner ces utilisateurs à un autre rôle avant de tenter à nouveau la suppression.
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
                  <h3 className="font-title-md text-title-md text-on-surface">Supprimer le rôle</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Rôle : <strong>{role.post}</strong>
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
                Êtes-vous sûr de vouloir supprimer le rôle <strong>"{role.post}"</strong> ? Cette action est
                irréversible et supprimera toutes les permissions associées.
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
