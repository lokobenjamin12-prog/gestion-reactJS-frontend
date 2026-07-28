import { useCancelSessionMutation } from '../api/sessions.queries';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface CancelSessionDialogProps {
  session: { id: string; commercialNom: string } | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function CancelSessionDialog({ session, onClose, onCancelled }: CancelSessionDialogProps) {
  const managerId = useAuthStore((s) => s.user?.id);
  const cancelMutation = useCancelSessionMutation();

  const handleConfirm = () => {
    if (!session || !managerId) return;
    cancelMutation.mutate({ id: session.id, managerId }, { onSuccess: onCancelled });
  };

  const handleClose = () => {
    cancelMutation.reset();
    onClose();
  };

  return (
    <Modal open={!!session} onClose={handleClose}>
      {session && (
        <>
          <div className="flex items-start justify-between bg-error-container/10 p-lg">
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <Icon name="cancel" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Annuler la session</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Commercial : <strong>{session.commercialNom}</strong>
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
              Le stock de départ sera intégralement réintégré au stock central. Aucun flux financier ne sera calculé.
            </p>

            {cancelMutation.isError && (
              <p className="font-body-sm text-body-sm text-error">{getApiErrorMessage(cancelMutation.error)}</p>
            )}
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={cancelMutation.isPending}>
              Retour
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="cancel" className="text-sm" />
                  Annuler la session
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
