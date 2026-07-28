import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCategoryQuery, useUpdateCategoryMutation } from '../api/categories.queries';
import { updateCategorySchema, toUpdateCategoryPayload, type UpdateCategoryFormValues } from '../schemas/category.schemas';
import { getAlertBadgeClass } from '../lib/categoryDisplay';
import type { CategoryDetail } from '../types/category.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: category, isLoading, isError, error } = useCategoryQuery(id ?? '');

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !category) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce format.')}
      </div>
    );
  }

  return (
    <EditCategoryForm category={category} onSaved={() => navigate(`/categories/${category.id}`, { replace: true })} />
  );
}

interface EditCategoryFormProps {
  category: CategoryDetail;
  onSaved: () => void;
}

function EditCategoryForm({ category, onSaved }: EditCategoryFormProps) {
  const updateMutation = useUpdateCategoryMutation();
  const errorRef = useScrollToError(updateMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      nomUnique: category.nomFormat,
      prixUnite: String(category.prixUnite),
      description: category.description ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate({ id: category.id, payload: toUpdateCategoryPayload(values) }, { onSuccess: onSaved });
  });

  return (
    <div className="mx-auto max-w-[56rem]">
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Stock</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/categories" className="hover:text-primary">
          Catégories
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Modifier</span>
      </nav>

      <div className="mb-lg flex items-center justify-between gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg">
        <div className="flex items-center gap-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest">
            <Icon name="package_2" className="text-[28px] text-secondary" />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Article parent</p>
            <h3 className="font-headline-lg text-[22px] text-on-surface">{category.article.nom}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="font-label-md text-label-md text-on-surface-variant">Format actuel</p>
          <p className="font-title-md text-title-md text-on-surface">{category.nomFormat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl">
            <div className="mb-xl">
              <h4 className="font-title-md text-title-md text-on-surface">Détails du format</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Mettez à jour les informations commerciales du format sélectionné.
              </p>
            </div>

            {updateMutation.isError && (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
              >
                <Icon name="error" className="mt-0.5 text-[20px]" />
                <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateMutation.error)}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-lg" noValidate>
              <div>
                <Input
                  label="Nom du format"
                  error={errors.nomUnique?.message}
                  {...register('nomUnique')}
                />
                <p className="mt-xs font-label-sm text-label-sm text-outline">
                  Ex: "Sachet 500g", "Pot 1kg", "Lot de 3"
                </p>
              </div>

              <Input
                label="Prix unitaire (FCFA)"
                type="number"
                min="0"
                error={errors.prixUnite?.message}
                {...register('prixUnite')}
              />

              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Détails sur le conditionnement ou spécificités du format..."
                  className="w-full resize-none rounded-lg border border-outline-variant bg-white px-md py-sm font-body-md text-body-md outline-none focus:border-primary"
                  {...register('description')}
                />
              </div>

              <div className="flex items-start gap-md rounded-lg bg-surface-container p-md">
                <Icon name="info" className="mt-0.5 text-outline" />
                <p className="font-label-sm text-label-sm leading-relaxed text-on-surface-variant">
                  Les modifications de prix s'appliquent immédiatement. Les quantités en stock ne sont pas
                  affectées par ce changement.
                </p>
              </div>

              <div className="flex items-center justify-end gap-md pt-md">
                <Link to={`/categories/${category.id}`}>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Icon name="progress_activity" className="animate-spin" />
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-highest p-lg">
            <h5 className="mb-md flex items-center gap-xs font-title-md text-title-md text-on-surface">
              <Icon name="lock" className="text-outline" />
              État actuel du stock
            </h5>
            <div className="space-y-md">
              <div className="border-b border-outline-variant pb-sm">
                <p className="font-label-sm text-label-sm font-bold uppercase text-outline">Quantité disponible</p>
                <p className="font-body-md text-body-md text-on-surface">
                  {category.stock?.quantiteActuelle ?? 0} unités
                </p>
              </div>
              <div>
                <p className="mb-1 font-label-sm text-label-sm font-bold uppercase text-outline">Niveau d'alerte</p>
                <span
                  className={`inline-flex items-center rounded px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getAlertBadgeClass(category.stock?.niveauAlerte ?? 'NORMAL')}`}
                >
                  {category.stock?.niveauAlerte ?? 'NORMAL'}
                </span>
              </div>
            </div>
            <p className="mt-lg font-label-sm text-label-sm italic text-on-surface-variant">
              Contactez l'administrateur système pour modifier les seuils de stock ou l'article parent de ce
              format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
