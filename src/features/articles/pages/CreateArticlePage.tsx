import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateArticleMutation, useCreateSimpleArticleMutation } from '../api/articles.queries';
import {
  createArticleSchema,
  createSimpleArticleSchema,
  toCreateArticlePayload,
  type CreateArticleFormValues,
  type CreateSimpleArticleFormValues,
} from '../schemas/article.schemas';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

type Mode = 'complete' | 'simple';

export function CreateArticlePage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(() => (searchParams.get('mode') === 'simple' ? 'simple' : 'complete'));

  return (
    <div className="mx-auto max-w-[48rem]">
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <Link to="/articles" className="hover:text-primary">
          Articles
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="font-bold text-primary">
          {mode === 'complete' ? 'Créer un nouvel article' : 'Créer une référence simple'}
        </span>
      </nav>
      <h2 className="font-headline-lg text-headline-lg text-primary">
        {mode === 'complete' ? 'Nouvel article' : 'Nouvelle référence simple'}
      </h2>
      <p className="mb-xl font-body-md text-body-md text-on-surface-variant">
        {mode === 'complete'
          ? 'Renseignez les informations ci-dessous pour créer un article et configurer son premier format de vente.'
          : "Créez seulement une référence de base — vous pourrez lui ajouter un ou plusieurs formats plus tard."}
      </p>

      {mode === 'complete' ? (
        <CompleteForm onSwitchToSimple={() => setMode('simple')} />
      ) : (
        <SimpleForm onSwitchToComplete={() => setMode('complete')} />
      )}
    </div>
  );
}

function CompleteForm({ onSwitchToSimple }: { onSwitchToSimple: () => void }) {
  const navigate = useNavigate();
  const createMutation = useCreateArticleMutation();
  const errorRef = useScrollToError(createMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateArticleFormValues>({
    resolver: zodResolver(createArticleSchema),
  });

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(toCreateArticlePayload(values), {
      onSuccess: (data) => navigate(`/articles/${data.id}`, { replace: true }),
    });
  });

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      {createMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="m-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="divide-y divide-outline-variant" noValidate>
        <div className="space-y-lg p-lg">
          <div className="flex items-center gap-sm">
            <Icon name="description" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Informations générales</h3>
          </div>
          <Input
            label="Nom de l'article"
            placeholder="Ex: Eau Minérale Ndolé"
            error={errors.nom?.message}
            {...register('nom')}
          />
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
              Description (optionnelle)
            </label>
            <textarea
              rows={3}
              placeholder="Détails sur l'article, ses caractéristiques..."
              className="w-full resize-none rounded-lg border border-outline-variant bg-white px-md py-sm font-body-md text-body-md outline-none focus:border-primary"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-xs font-body-sm text-body-sm text-error">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-lg bg-surface-container-low p-lg">
          <div className="flex items-center gap-sm">
            <Icon name="inventory" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Configuration du premier format</h3>
          </div>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <Input
              label="Nom du format"
              placeholder="Ex: Carton 12x 1.5L"
              error={errors.nomUniqueCategory?.message}
              {...register('nomUniqueCategory')}
            />
            <Input
              label="Prix unitaire (FCFA)"
              type="number"
              min="0"
              placeholder="0"
              error={errors.prixUnite?.message}
              {...register('prixUnite')}
            />
            <Input
              label="Seuil d'alerte (optionnel)"
              type="number"
              min="1"
              placeholder="10"
              error={errors.seuilAlerte?.message}
              {...register('seuilAlerte')}
            />
            <Input
              label="Seuil critique (optionnel)"
              type="number"
              min="0"
              placeholder="5"
              error={errors.seuilCritique?.message}
              {...register('seuilCritique')}
            />
          </div>

          <div className="flex items-start gap-sm rounded-lg bg-primary-fixed p-md text-on-primary-fixed">
            <Icon name="info" className="mt-0.5 text-[20px]" />
            <p className="font-body-md text-body-md leading-relaxed">
              La création initialise automatiquement le stock à 0 pour ce format. Vous pourrez effectuer un
              approvisionnement une fois l'article créé.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-md bg-surface-container p-lg">
          <button
            type="button"
            onClick={onSwitchToSimple}
            className="font-label-md text-label-md text-primary hover:underline"
          >
            Créer une référence simple à la place
          </button>
          <div className="flex gap-md">
            <Link to="/articles">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  Créer l'article
                  <Icon name="add_circle" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SimpleForm({ onSwitchToComplete }: { onSwitchToComplete: () => void }) {
  const navigate = useNavigate();
  const createSimpleMutation = useCreateSimpleArticleMutation();
  const errorRef = useScrollToError(createSimpleMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSimpleArticleFormValues>({
    resolver: zodResolver(createSimpleArticleSchema),
  });

  const onSubmit = handleSubmit((values) => {
    createSimpleMutation.mutate(values, {
      onSuccess: (data) => navigate(`/articles/${data.id}`, { replace: true }),
    });
  });

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      {createSimpleMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="m-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createSimpleMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="p-lg" noValidate>
        <Input
          label="Nom de l'article"
          placeholder="Ex: Eau Minérale Ndolé"
          error={errors.nomArticle?.message}
          {...register('nomArticle')}
        />

        <div className="mt-lg flex items-start gap-sm rounded-lg bg-surface-container p-md">
          <Icon name="info" className="mt-0.5 text-[20px] text-secondary" />
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Aucun format ni stock ne sera créé — vous pourrez en ajouter depuis la fiche de l'article une fois
            celui-ci créé.
          </p>
        </div>

        <div className="mt-xl flex items-center justify-between gap-md border-t border-outline-variant pt-lg">
          <button
            type="button"
            onClick={onSwitchToComplete}
            className="font-label-md text-label-md text-primary hover:underline"
          >
            Créer un article complet à la place
          </button>
          <div className="flex gap-md">
            <Link to="/articles">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={createSimpleMutation.isPending}>
              {createSimpleMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  Créer la référence
                  <Icon name="add_circle" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
