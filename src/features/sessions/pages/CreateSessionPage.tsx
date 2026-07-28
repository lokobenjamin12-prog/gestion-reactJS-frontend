import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useOpenSessionMutation } from '../api/sessions.queries';
import { openSessionSchema, toOpenSessionPayload, type OpenSessionFormValues } from '../schemas/session.schemas';
import { useStockOverviewQuery } from '@/features/movements/api/movements.queries';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateSessionPage() {
  const navigate = useNavigate();
  const openMutation = useOpenSessionMutation();
  const { data: usersData } = useUsersQuery({ limit: 100 });
  const { data: stocksData } = useStockOverviewQuery();
  const errorRef = useScrollToError(openMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenSessionFormValues>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: { jourOuverture: today() },
  });

  // Le backend rejette (400) l'ouverture pour un commercial inactif — on
  // filtre la liste pour éviter cette erreur évitable, sans fabriquer de champ.
  const commerciaux = (usersData?.data ?? []).filter((u) => u.active);

  const onSubmit = handleSubmit((values) => {
    openMutation.mutate(toOpenSessionPayload(values), {
      onSuccess: (session) => navigate(`/sessions/${session.id}`),
    });
  });

  return (
    <div className="mx-auto max-w-[42rem]">
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <Link to="/sessions" className="hover:text-primary">
          Sessions
        </Link>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Ouvrir une session</span>
      </nav>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-[24px] text-on-surface">Ouvrir une session</h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Configurez les paramètres de départ pour la nouvelle tournée commerciale.
          </p>
        </div>

        {openMutation.isError && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
          >
            <Icon name="error" className="mt-0.5 text-[20px]" />
            <p className="font-body-sm text-body-sm">{getApiErrorMessage(openMutation.error)}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-lg" noValidate>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <div>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Commercial</label>
              <Select className="w-full" {...register('commercialId')}>
                <option value="">Sélectionner un agent</option>
                {commerciaux.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </Select>
              {errors.commercialId && (
                <p className="mt-xs font-body-sm text-body-sm text-error">{errors.commercialId.message}</p>
              )}
            </div>

            <Input
              label="Jour d'ouverture"
              type="date"
              error={errors.jourOuverture?.message}
              {...register('jourOuverture')}
            />
          </div>

          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
              Article et format
            </label>
            <Select className="w-full" {...register('articleStockId')}>
              <option value="">Sélectionner un article et un format</option>
              {stocksData?.map((s) => (
                <option key={s.stockId} value={s.stockId}>
                  {s.nomArticle} — {s.categoryNom} (stock actuel : {s.quantite})
                </option>
              ))}
            </Select>
            {errors.articleStockId && (
              <p className="mt-xs font-body-sm text-body-sm text-error">{errors.articleStockId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <Input
              label="Quantité de départ"
              type="number"
              min="1"
              placeholder="0"
              error={errors.quantiteDepart?.message}
              {...register('quantiteDepart')}
            />
            <Input
              label="Heure de départ (optionnel)"
              type="time"
              error={errors.heureDepart?.message}
              {...register('heureDepart')}
            />
          </div>

          <div className="flex items-start gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md">
            <Icon name="info" className="mt-0.5 text-secondary" />
            <div>
              <p className="font-title-md text-title-md text-on-surface">Récapitulatif de stock</p>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Une fois la session ouverte, le stock sélectionné sera immédiatement décrémenté du stock central et
                confié au commercial.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-md border-t border-outline-variant pt-md">
            <Button variant="outline" type="button" onClick={() => navigate('/sessions')}>
              Annuler
            </Button>
            <Button type="submit" disabled={openMutation.isPending}>
              {openMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="check_circle" className="text-sm" />
                  Ouvrir la session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
