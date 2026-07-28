import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useContratQuery, useUpdateContratMutation } from '../api/contrats.queries';
import { updateContratSchema, toUpdateContratPayload, type UpdateContratFormValues } from '../schemas/contrat.schemas';
import { formatDate, getTypeBadgeClass } from '../lib/contratDisplay';
import type { Contrat } from '../types/contrat.types';
import { useUserQuery } from '@/features/users/api/users.queries';
import { useDepartmentsQuery } from '@/features/departments/api/departments.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function EditContratPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contrat, isLoading, isError, error } = useContratQuery(id!);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !contrat) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce contrat.')}
      </div>
    );
  }

  return <EditContratForm contrat={contrat} onSaved={() => navigate(`/contrats/${contrat.id}`, { replace: true })} />;
}

interface EditContratFormProps {
  contrat: Contrat;
  onSaved: () => void;
}

function EditContratForm({ contrat, onSaved }: EditContratFormProps) {
  const updateContratMutation = useUpdateContratMutation();
  // Poste et département viennent du rôle du collaborateur, pas du contrat —
  // on va chercher la fiche utilisateur complète pour l'afficher en contexte.
  const { data: user } = useUserQuery(contrat.userId);
  const { data: departmentsData } = useDepartmentsQuery();
  const department = departmentsData?.data.find((d) => d.id === user?.role.departmentId);
  const errorRef = useScrollToError(updateContratMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateContratFormValues>({
    resolver: zodResolver(updateContratSchema),
    defaultValues: { dateFin: contrat.dateFin?.slice(0, 10) ?? '' },
  });

  const onSubmit = handleSubmit((values) => {
    updateContratMutation.mutate(
      { id: contrat.id, payload: toUpdateContratPayload(values) },
      { onSuccess: onSaved },
    );
  });

  if (contrat.type === 'CDI') {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
        <Icon name="block" className="mb-md text-[40px] text-outline" />
        <h2 className="mb-xs font-title-md text-title-md text-on-surface">Modification impossible</h2>
        <p className="mb-lg font-body-md text-body-md text-on-surface-variant">
          Un CDI n'a pas de date de fin et ne peut pas être modifié après sa création.
        </p>
        <Link to={`/contrats/${contrat.id}`}>
          <Button variant="outline">Retour au contrat</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/contrats" className="hover:text-primary">
          Contrats
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Modification CDD</span>
      </nav>

      <div className="grid grid-cols-1 gap-xl lg:grid-cols-12">
        {/* Formulaire */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg md:p-xl">
            <div className="mb-xl">
              <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">Détails du contrat</h3>
              <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                Mise à jour de la durée du contrat à durée déterminée.
              </p>
            </div>

            {updateContratMutation.isError && (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
              >
                <Icon name="error" className="mt-0.5 text-[20px]" />
                <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateContratMutation.error)}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-xl" noValidate>
              <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant">Collaborateur</label>
                  <div className="flex h-12 cursor-not-allowed items-center rounded-lg border border-outline-variant/30 bg-surface-container-high px-md font-body-md text-body-md text-on-surface opacity-80">
                    {contrat.user.firstName} {contrat.user.lastName}
                  </div>
                </div>
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant">Type de contrat</label>
                  <div className="flex h-12 cursor-not-allowed items-center rounded-lg border border-outline-variant/30 bg-surface-container-high px-md opacity-80">
                    <span className={`rounded px-sm py-xs font-label-md text-[10px] font-black uppercase tracking-wider ${getTypeBadgeClass(contrat.type)}`}>
                      {contrat.type}
                    </span>
                  </div>
                </div>
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant">Date de début</label>
                  <div className="flex h-12 cursor-not-allowed items-center gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-high px-md font-body-md text-body-md text-on-surface opacity-80">
                    <Icon name="calendar_today" className="text-[20px] text-on-surface-variant" />
                    {formatDate(contrat.dateDebut)}
                  </div>
                </div>
              </div>

              <hr className="border-outline-variant/50" />

              <div className="space-y-sm">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md font-bold text-primary">Nouvelle date de fin</label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Requis</span>
                </div>
                <input
                  type="date"
                  className="h-12 w-full rounded-lg border border-outline bg-surface-container-lowest px-md font-body-md text-body-md text-on-surface outline-none focus:border-2 focus:border-primary"
                  {...register('dateFin')}
                />
                {errors.dateFin && (
                  <p className="font-body-sm text-body-sm text-error">{errors.dateFin.message}</p>
                )}
                <p className="flex items-center gap-xs pt-xs font-body-sm text-body-sm italic text-on-surface-variant">
                  <Icon name="info" className="text-[16px]" />
                  Seule la date de fin d'un CDD peut être modifiée.
                </p>
              </div>

              <div className="flex items-center justify-end gap-md pt-xl">
                <Link to={`/contrats/${contrat.id}`}>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={updateContratMutation.isPending}>
                  {updateContratMutation.isPending ? (
                    <Icon name="progress_activity" className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="save" className="text-[20px]" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Résumé du dossier */}
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-md rounded-xl bg-secondary-fixed p-lg text-on-secondary-fixed-variant">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed-dim">
              <Icon name="assignment_ind" />
            </div>
            <div>
              <h4 className="font-title-md text-title-md font-bold">Résumé du dossier</h4>
              <p className="font-body-sm text-body-sm opacity-80">
                Rappel des conditions actuelles avant modification.
              </p>
            </div>
            <div className="mt-sm space-y-sm font-label-md text-label-md">
              <div className="flex justify-between border-b border-on-secondary-fixed-variant/10 py-xs">
                <span className="opacity-70">Poste :</span>
                <span>{user?.role.post ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b border-on-secondary-fixed-variant/10 py-xs">
                <span className="opacity-70">Département :</span>
                <span>{department?.name ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
