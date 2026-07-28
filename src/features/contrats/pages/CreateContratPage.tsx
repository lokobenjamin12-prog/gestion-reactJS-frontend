import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateContratMutation } from '../api/contrats.queries';
import { createContratSchema, toCreateContratPayload, type CreateContratFormValues } from '../schemas/contrat.schemas';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function CreateContratPage() {
  const navigate = useNavigate();
  const createContratMutation = useCreateContratMutation();
  // Le backend rejette la création d'un contrat pour un collaborateur archivé.
  const { data: usersData } = useUsersQuery({ estArchive: false, limit: 100 });
  const errorRef = useScrollToError(createContratMutation.isError);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateContratFormValues>({
    resolver: zodResolver(createContratSchema),
  });

  const type = watch('type');

  const onSubmit = handleSubmit((values) => {
    createContratMutation.mutate(toCreateContratPayload(values), {
      onSuccess: (data) => navigate(`/contrats/${data.id}`, { replace: true }),
    });
  });

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <span>RH</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/contrats" className="hover:text-primary">
          Contrats
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Nouveau Contrat</span>
      </nav>
      <h2 className="font-headline-lg text-headline-lg text-primary">Créer un nouveau contrat</h2>
      <p className="mb-xl font-body-md text-body-md text-on-surface-variant">
        Veuillez renseigner les informations contractuelles du collaborateur.
      </p>

      {createContratMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex max-w-2xl items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createContratMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="max-w-2xl rounded-xl border border-outline-variant bg-surface-container-low p-lg" noValidate>
        <div className="space-y-lg">
          <div>
            <label className="mb-1 block font-label-md text-label-md font-bold text-on-surface">Collaborateur</label>
            <Select className="w-full" {...register('userId')}>
              <option value="">Sélectionner un collaborateur actif</option>
              {usersData?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.email}
                </option>
              ))}
            </Select>
            {errors.userId && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.userId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block font-label-md text-label-md font-bold text-on-surface">Type de contrat</label>
            <div className="grid grid-cols-2 gap-md">
              <label
                className={`flex items-center gap-md rounded-lg border p-md transition-all ${
                  type === 'CDI' ? 'border-primary bg-secondary-container' : 'cursor-pointer border-outline hover:bg-surface-container'
                }`}
              >
                <input type="radio" value="CDI" className="h-5 w-5 accent-primary" {...register('type')} />
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface">CDI</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Indéterminé</span>
                </div>
              </label>
              <label
                className={`flex items-center gap-md rounded-lg border p-md transition-all ${
                  type === 'CDD' ? 'border-primary bg-secondary-container' : 'cursor-pointer border-outline hover:bg-surface-container'
                }`}
              >
                <input type="radio" value="CDD" className="h-5 w-5 accent-primary" {...register('type')} />
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface">CDD</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Déterminé</span>
                </div>
              </label>
            </div>
            {errors.type && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.type.message}</p>}
          </div>

          <div>
            <label className="mb-1 block font-label-md text-label-md font-bold text-on-surface">Date de début</label>
            <input
              type="date"
              className="h-12 w-full rounded-lg border border-outline bg-white px-md font-body-md text-body-md outline-none focus:border-2 focus:border-primary"
              {...register('dateDebut')}
            />
            {errors.dateDebut && (
              <p className="mt-xs font-body-sm text-body-sm text-error">{errors.dateDebut.message}</p>
            )}
          </div>

          {type === 'CDD' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 block font-label-md text-label-md font-bold text-on-surface">
                  Date de fin
                </label>
                <span className="font-label-sm text-label-sm italic text-error">Obligatoire pour un CDD</span>
              </div>
              <input
                type="date"
                className="h-12 w-full rounded-lg border border-outline bg-white px-md font-body-md text-body-md outline-none focus:border-2 focus:border-primary"
                {...register('dateFin')}
              />
              {errors.dateFin && (
                <p className="mt-xs font-body-sm text-body-sm text-error">{errors.dateFin.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-xl flex items-center justify-end gap-md">
          <Link to="/contrats">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={createContratMutation.isPending}>
            {createContratMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="add" />
                Créer le contrat
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
