import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategoriesListQuery } from '../api/categories.queries';
import { ArchiveCategoryDialog } from '../components/ArchiveCategoryDialog';
import { formatCurrency, getAlertBadgeClass } from '../lib/categoryDisplay';
import type { CategoryListItem } from '../types/category.types';
import { useArticlesQuery } from '@/features/articles/api/articles.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function CategoriesListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [articleId, setArticleId] = useState('');
  const [page, setPage] = useState(1);
  const [archiving, setArchiving] = useState<CategoryListItem | null>(null);

  const canCreate = usePermission('category:create');
  const canUpdate = usePermission('category:update');

  const { data: articlesData } = useArticlesQuery();

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, articleId]);

  const { data, isLoading, isError, error } = useCategoriesListQuery({
    search: search || undefined,
    articleId: articleId || undefined,
    page,
    limit: 10,
  });

  const categories = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span>Stock</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Catégories</span>
      </nav>

      <div className="mb-xl flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Catégories</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Formats de conditionnement par article.
          </p>
        </div>
        {canCreate ? (
          <Link to="/categories/new">
            <Button>
              <Icon name="add_box" />
              Nouveau format
            </Button>
          </Link>
        ) : (
          <Button title="Permission category:create requise" disabled>
            <Icon name="add_box" />
            Nouveau format
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-md p-md">
          <div className="min-w-[16rem] flex-1">
            <Input
              icon="search"
              placeholder="Rechercher un format..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Rechercher un format"
            />
          </div>
          <Select value={articleId} onChange={(e) => setArticleId(e.target.value)}>
            <option value="">Tous les articles</option>
            {articlesData?.data.map((article) => (
              <option key={article.id} value={article.id}>
                {article.nom}
              </option>
            ))}
          </Select>
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Format
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Article parent
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Prix unitaire
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Quantité
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  État stock
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-lg py-md" colSpan={6}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={6}>
                    {getApiErrorMessage(error, 'Impossible de charger les formats.')}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={6}
                  >
                    Aucun format trouvé. Essayez d'ajuster vos filtres ou créez un nouveau format.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="group transition-colors hover:bg-surface-container">
                    <td className="px-lg py-sm font-body-md text-body-md font-semibold text-on-surface">
                      {category.nomUnique}
                    </td>
                    <td className="px-lg py-sm">
                      <Link
                        to={`/articles/${category.article.id}`}
                        className="font-label-md text-label-md text-primary hover:underline"
                      >
                        {category.article.nom}
                      </Link>
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                      {formatCurrency(category.prixUnite)}
                    </td>
                    <td className="px-lg py-sm text-center font-label-md text-label-md text-on-surface-variant">
                      {category.quantiteDisponible}
                    </td>
                    <td className="px-lg py-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getAlertBadgeClass(category.alerte)}`}
                      >
                        {category.alerte}
                      </span>
                    </td>
                    <td className="px-lg py-sm text-right">
                      <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          to={`/categories/${category.id}`}
                          title="Voir"
                          className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                        >
                          <Icon name="visibility" className="text-[20px]" />
                        </Link>
                        {canUpdate ? (
                          <Link
                            to={`/categories/${category.id}/edit`}
                            title="Modifier"
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                          >
                            <Icon name="edit" className="text-[20px]" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            title="Permission category:update requise"
                            disabled
                            className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="edit" className="text-[20px]" />
                          </button>
                        )}
                        <button
                          type="button"
                          title={canUpdate ? 'Archiver' : 'Permission category:update requise'}
                          disabled={!canUpdate}
                          onClick={() => setArchiving(category)}
                          className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icon name="archive" className="text-[20px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/30 p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} formats
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ArchiveCategoryDialog category={archiving} onClose={() => setArchiving(null)} onArchived={() => setArchiving(null)} />
    </>
  );
}
