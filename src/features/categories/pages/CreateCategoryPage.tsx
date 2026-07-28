import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateCategoryMutation } from '../api/categories.queries';
import { createCategorySchema, toCreateCategoryPayload, type CreateCategoryFormValues } from '../schemas/category.schemas';
import { useArticlesQuery } from '@/features/articles/api/articles.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function CreateCategoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createMutation = useCreateCategoryMutation();
  const { data: articlesData } = useArticlesQuery();
  const errorRef = useScrollToError(createMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { articleId: searchParams.get('articleId') ?? '' },
  });

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(toCreateCategoryPayload(values), {
      onSuccess: (data) => navigate(`/categories/${data.id}`, { replace: true }),
    });
  });

  return (
    <div className="mx-auto max-w-[48rem]">
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Stock</span>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link to="/categories" className="hover:text-primary">
          Catégories
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">Nouveau format</span>
      </nav>
      <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Créer un nouveau format</h2>
      <p className="mb-xl font-body-md text-body-md text-on-surface-variant">
        Configurez une nouvelle variante d'article pour la gestion de votre inventaire.
      </p>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
        {createMutation.isError && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
          >
            <Icon name="error" className="mt-0.5 text-[20px]" />
            <p className="font-body-sm text-body-sm">{getApiErrorMessage(createMutation.error)}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-lg" noValidate>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <div>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                Article parent
              </label>
              <Select className="w-full" {...register('articleId')}>
                <option value="">Sélectionner l'article principal</option>
                {articlesData?.data.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.nom}
                  </option>
                ))}
              </Select>
              {errors.articleId && (
                <p className="mt-xs font-body-sm text-body-sm text-error">{errors.articleId.message}</p>
              )}
            </div>
            <Input
              label="Nom du format"
              placeholder="ex: Bouteille 1L"
              error={errors.nomUnique?.message}
              {...register('nomUnique')}
            />
            <Input
              label="Prix unitaire (FCFA)"
              type="number"
              min="0"
              placeholder="0"
              error={errors.prixUnite?.message}
              {...register('prixUnite')}
            />
          </div>

          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
              Description (optionnelle)
            </label>
            <textarea
              rows={3}
              placeholder="Informations complémentaires sur le conditionnement..."
              className="w-full resize-none rounded-lg border border-outline-variant bg-white px-md py-sm font-body-md text-body-md outline-none focus:border-primary"
              {...register('description')}
            />
          </div>

          <div className="border-t border-outline-variant pt-lg">
            <h3 className="mb-md font-title-md text-title-md text-on-surface">Gestion des seuils de stock</h3>
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <div>
                <Input
                  label="Seuil d'alerte"
                  type="number"
                  min="1"
                  placeholder="15"
                  error={errors.seuilAlerte?.message}
                  {...register('seuilAlerte')}
                />
                <p className="mt-xs font-label-sm text-label-sm italic text-on-surface-variant">
                  Niveau recommandé pour le réapprovisionnement.
                </p>
              </div>
              <div>
                <Input
                  label="Seuil critique"
                  type="number"
                  min="0"
                  placeholder="5"
                  error={errors.seuilCritique?.message}
                  {...register('seuilCritique')}
                />
                <p className="mt-xs font-label-sm text-label-sm italic text-on-surface-variant">
                  Niveau bloquant nécessitant une action urgente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-md pt-lg">
            <Link to="/categories">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="add_circle" className="text-[18px]" />
                  Créer le format
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-xl grid grid-cols-1 gap-md md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <div className="mb-xs flex items-center gap-xs text-primary">
            <Icon name="info" className="text-[20px]" />
            <h4 className="font-label-md text-label-md">Pourquoi des seuils ?</h4>
          </div>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Les seuils déterminent le niveau d'alerte affiché sur chaque format (Normal / Alerte / Critique) et
            aident à anticiper les commandes fournisseurs.
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <div className="mb-xs flex items-center gap-xs text-primary">
            <Icon name="history" className="text-[20px]" />
            <h4 className="font-label-md text-label-md">Traçabilité</h4>
          </div>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Toute création de format est enregistrée dans le journal d'audit de l'établissement.
          </p>
        </div>
      </div>
    </div>
  );
}
