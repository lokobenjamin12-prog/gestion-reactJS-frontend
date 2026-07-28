import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCategoryQuery } from '../api/categories.queries';
import { ArchiveCategoryDialog } from '../components/ArchiveCategoryDialog';
import { formatCurrency, getAlertBadgeClass } from '../lib/categoryDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: category, isLoading, isError, error } = useCategoryQuery(id ?? '');
  const canUpdate = usePermission('category:update');
  const [archiving, setArchiving] = useState(false);

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
    <>
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span>Stock</span>
        <span className="mx-1">/</span>
        <Link to="/categories" className="hover:text-primary">
          Catégories
        </Link>
        <span className="mx-1">/</span>
        <span className="text-on-surface">
          {category.article.nom} — {category.nomFormat}
        </span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-sm">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{category.nomFormat}</h2>
            <span className="rounded-full bg-emerald-100 px-sm py-1 font-label-sm text-label-sm font-bold uppercase text-emerald-800">
              Actif
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Article parent : <span className="font-medium text-on-surface">{category.article.nom}</span>
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Button
            variant="outline"
            title={canUpdate ? 'Archiver' : 'Permission category:update requise'}
            disabled={!canUpdate}
            onClick={() => setArchiving(true)}
          >
            <Icon name="archive" />
            Archiver
          </Button>
          {canUpdate ? (
            <Link to={`/categories/${category.id}/edit`}>
              <Button>
                <Icon name="edit" />
                Modifier
              </Button>
            </Link>
          ) : (
            <Button title="Permission category:update requise" disabled>
              <Icon name="edit" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
            <h3 className="mb-lg font-title-md text-title-md text-on-surface">Informations générales</h3>
            <div className="grid grid-cols-1 gap-xl sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Prix unitaire</p>
                <p className="font-headline-lg text-[28px] font-bold text-primary">
                  {formatCurrency(category.prixUnite)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Statut du stock</p>
                <span
                  className={`inline-flex items-center gap-xs rounded px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getAlertBadgeClass(category.stock?.niveauAlerte ?? 'NORMAL')}`}
                >
                  {category.stock?.niveauAlerte ?? 'NORMAL'}
                </span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Description</p>
                <p className="rounded-lg bg-surface-container-low p-md font-body-md text-body-md text-on-surface">
                  {category.description || 'Aucune description renseignée.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="rounded-xl bg-primary p-lg text-on-primary">
            <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider opacity-80">
              Quantité en stock
            </p>
            <p className="font-headline-lg text-[40px] font-bold">{category.stock?.quantiteActuelle ?? 0}</p>
          </div>
        </div>
      </div>

      <ArchiveCategoryDialog
        category={archiving ? { id: category.id, nomUnique: category.nomFormat } : null}
        onClose={() => setArchiving(false)}
        // Une fois archivée, GET /categories/find-one/:id renvoie 410 (Gone) —
        // rester sur cette page ferait immédiatement échouer le refetch. On
        // redirige donc vers la liste, seul endroit où cette catégorie reste
        // indirectement "traçable" (même si elle n'y apparaîtra plus non plus).
        onArchived={() => navigate('/categories', { replace: true })}
      />
    </>
  );
}
