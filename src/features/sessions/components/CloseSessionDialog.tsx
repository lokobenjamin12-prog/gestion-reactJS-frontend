import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCloseSessionMutation } from '../api/sessions.queries';
import {
  createCloseSessionSchema,
  toCloseSessionPayload,
  type CloseSessionFormValues,
} from '../schemas/session.schemas';
import { formatCurrency } from '../lib/sessionDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

interface CloseSessionDialogProps {
  session: { id: string; commercialNom: string; quantiteDepart: number; prixUnite: number } | null;
  onClose: () => void;
  onClosed: () => void;
}

export function CloseSessionDialog({ session, onClose, onClosed }: CloseSessionDialogProps) {
  if (!session) return null;
  return (
    <CloseSessionForm session={session} onClose={onClose} onClosed={onClosed} />
  );
}

function CloseSessionForm({
  session,
  onClose,
  onClosed,
}: {
  session: { id: string; commercialNom: string; quantiteDepart: number; prixUnite: number };
  onClose: () => void;
  onClosed: () => void;
}) {
  const closeMutation = useCloseSessionMutation();
  const schema = createCloseSessionSchema(session.quantiteDepart);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CloseSessionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantiteRetour: '0', heureRetour: '', depenses: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'depenses' });

  const quantiteRetour = Number(watch('quantiteRetour')) || 0;
  const depenses = watch('depenses');
  const quantiteVendue = Math.max(0, session.quantiteDepart - quantiteRetour);
  const chiffreAffaireTheorique = quantiteVendue * session.prixUnite;
  const totalDepenses = depenses.reduce((sum, d) => sum + (Number(d.montant) || 0), 0);
  const netAPercevoir = chiffreAffaireTheorique - totalDepenses;

  const handleClose = () => {
    closeMutation.reset();
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    closeMutation.mutate({ id: session.id, payload: toCloseSessionPayload(values) }, { onSuccess: onClosed });
  });

  return (
    <Modal open onClose={handleClose} widthClassName="max-w-[42rem]">
      <form onSubmit={onSubmit} noValidate>
        <div className="flex items-start justify-between border-b border-outline-variant p-lg">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Clôturer la session</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enregistrez les chiffres de fin de journée pour cette session commerciale.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="Fermer"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-xl">
          {closeMutation.isError && (
            <p className="mb-lg font-body-sm text-body-sm text-error">{getApiErrorMessage(closeMutation.error)}</p>
          )}

          <div className="mb-xl flex items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low p-md">
            <div className="flex items-center gap-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                <Icon name="person" />
              </div>
              <div>
                <p className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">
                  Commercial
                </p>
                <p className="font-title-md text-title-md text-on-surface">{session.commercialNom}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">
                Quantité départ
              </p>
              <p className="font-headline-sm text-headline-sm text-primary">{session.quantiteDepart}</p>
            </div>
          </div>

          <div className="mb-xl grid grid-cols-1 gap-lg md:grid-cols-2">
            <div className="flex flex-col gap-xs">
              <label className="font-label-lg text-label-lg text-on-surface-variant">Quantité retournée</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={session.quantiteDepart}
                  className="h-12 w-full rounded-lg border border-outline bg-white px-md font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  {...register('quantiteRetour')}
                />
                <span className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 font-label-lg text-label-lg text-on-surface-variant">
                  Unités
                </span>
              </div>
              {errors.quantiteRetour && (
                <p className="font-body-sm text-body-sm text-error">{errors.quantiteRetour.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-lg text-label-lg text-on-surface-variant">Heure de retour (optionnel)</label>
              <input
                type="time"
                className="h-12 w-full rounded-lg border border-outline bg-white px-md font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                {...register('heureRetour')}
              />
            </div>
          </div>

          <div className="mb-xl">
            <div className="mb-md flex items-center justify-between">
              <h4 className="font-title-md text-title-md text-on-surface">Dépenses de session</h4>
              <button
                type="button"
                onClick={() => append({ montant: '', motif: '' })}
                className="flex items-center gap-xs font-label-lg text-label-lg text-primary hover:underline"
              >
                <Icon name="add" className="text-[20px]" />
                Ajouter une dépense
              </button>
            </div>
            <div className="space-y-sm">
              {fields.map((field, index) => (
                <div key={field.id}>
                  <div className="flex items-start gap-sm">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Montant (FCFA)"
                        className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-md text-body-md outline-none focus:border-primary"
                        {...register(`depenses.${index}.montant` as const)}
                      />
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="text"
                        placeholder="Motif (ex: Carburant)"
                        className="h-11 w-full rounded-lg border border-outline-variant bg-white px-md font-body-md text-body-md outline-none focus:border-primary"
                        {...register(`depenses.${index}.motif` as const)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-full p-xs text-error transition-colors hover:bg-error-container/20"
                      aria-label="Supprimer cette dépense"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                  {errors.depenses?.[index]?.motif && (
                    <p className="mt-1 font-body-sm text-body-sm text-error">
                      {errors.depenses[index]?.motif?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-md rounded-xl bg-primary-container p-lg text-on-primary-container">
            <div className="flex items-center justify-between border-b border-on-primary-container/20 pb-sm">
              <span className="font-body-md text-body-md">Quantité vendue</span>
              <span className="font-headline-sm text-headline-sm text-on-primary">{quantiteVendue}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-body-md text-body-md">Chiffre d'affaires théorique</span>
                <p className="text-[10px] uppercase tracking-widest opacity-70">
                  Basé sur {formatCurrency(session.prixUnite)} / unité
                </p>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-primary">
                {formatCurrency(chiffreAffaireTheorique)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-on-primary-container/20 pt-xs">
              <span className="font-body-md text-body-md">Net à percevoir (dépenses déduites)</span>
              <span className="font-title-lg text-title-lg text-tertiary-fixed">{formatCurrency(netAPercevoir)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg">
          <Button variant="outline" type="button" onClick={handleClose} disabled={closeMutation.isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={closeMutation.isPending}>
            {closeMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="check_circle" className="text-sm" />
                Clôturer la session
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
