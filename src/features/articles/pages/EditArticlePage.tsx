import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArticleQuery, useUpdateArticleMutation } from '../api/articles.queries';
import { RestoreArticleDialog } from '../components/RestoreArticleDialog';
import { updateArticleSchema, type UpdateArticleFormValues } from '../schemas/article.schemas';
import type { ArticleDetail } from '../types/article.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, isError, error } = useArticleQuery(id ?? '');

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !article) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger cet article.')}
      </div>
    );
  }

  return (
    <EditArticleForm article={article} onSaved={() => navigate(`/articles/${article.id}`, { replace: true })} />
  );
}

interface EditArticleFormProps {
  article: ArticleDetail;
  onSaved: () => void;
}

function EditArticleForm({ article, onSaved }: EditArticleFormProps) {
  const updateMutation = useUpdateArticleMutation();
  const canUpdate = usePermission('article:update');
  const [restoring, setRestoring] = useState(false);
  const errorRef = useScrollToError(updateMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateArticleFormValues>({
    resolver: zodResolver(updateArticleSchema),
    defaultValues: { nom: article.nom },
  });

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate({ id: article.id, payload: values }, { onSuccess: onSaved });
  });

  return (
    <div className="mx-auto max-w-[40rem]">
      <div className="mb-lg flex items-center gap-sm">
        <Link
          to={`/articles/${article.id}`}
          className="rounded p-xs text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <nav className="mb-1 flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/articles" className="hover:text-primary">
              Articles
            </Link>
            <span className="mx-1">/</span>
            <span className="text-on-surface">Modifier</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Modifier l'article</h2>
        </div>
      </div>

      {article.isArchived && (
        <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-lg">
          <Icon name="inventory_2" className="mt-0.5 text-error" />
          <div className="flex-1">
            <p className="font-title-md text-title-md font-semibold text-on-error-container">
              Cet article est archivé
            </p>
            <p className="mt-xs font-body-md text-body-md text-on-error-container opacity-90">
              Restaurez-le pour effectuer des modifications. Les champs de saisie sont verrouillés tant que
              l'article n'est pas actif.
            </p>
            <Button
              variant="danger"
              className="mt-md"
              title={canUpdate ? 'Restaurer' : 'Permission article:update requise'}
              disabled={!canUpdate}
              onClick={() => setRestoring(true)}
            >
              <Icon name="unarchive" />
              Restaurer l'article
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-xl">
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

        <form onSubmit={onSubmit} className="space-y-xl" noValidate>
          <Input
            label="Nom de l'article"
            placeholder="Entrez le nom de l'article"
            disabled={article.isArchived}
            error={errors.nom?.message}
            {...register('nom')}
          />

          <div className="flex items-center justify-end gap-md border-t border-outline-variant pt-lg">
            <Link to={`/articles/${article.id}`}>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={article.isArchived || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </div>

      <RestoreArticleDialog
        article={restoring ? article : null}
        onClose={() => setRestoring(false)}
        onRestored={() => setRestoring(false)}
      />
    </div>
  );
}
