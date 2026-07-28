import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticlesListQuery } from '../api/articles.queries';
import { ArchiveArticleDialog } from '../components/ArchiveArticleDialog';
import { RestoreArticleDialog } from '../components/RestoreArticleDialog';
import { DeleteArticleDialog } from '../components/DeleteArticleDialog';
import { formatCurrency } from '../lib/articleDisplay';
import type { ArticleListItem, ArticleStatusFilter } from '../types/article.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function ArticlesListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ArticleStatusFilter>('ACTIVE');
  const [page, setPage] = useState(1);
  const [archiving, setArchiving] = useState<ArticleListItem | null>(null);
  const [restoring, setRestoring] = useState<ArticleListItem | null>(null);
  const [deleting, setDeleting] = useState<ArticleListItem | null>(null);

  const canCreate = usePermission('article:create');
  const canUpdate = usePermission('article:update');
  const canDelete = usePermission('article:delete');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading, isError, error } = useArticlesListQuery({
    search: search || undefined,
    status,
    page,
    limit: 10,
  });

  const articles = data?.data ?? [];
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
        <span className="font-bold text-primary">Articles</span>
      </nav>

      <div className="mb-xl flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Articles</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Catalogue des références produits.
          </p>
        </div>
        <div className="flex flex-col items-end gap-xs">
          {canCreate ? (
            <Link to="/articles/new">
              <Button>
                <Icon name="add" />
                Nouvel article
              </Button>
            </Link>
          ) : (
            <Button title="Permission article:create requise" disabled>
              <Icon name="add" />
              Nouvel article
            </Button>
          )}
          {canCreate ? (
            <Link
              to="/articles/new?mode=simple"
              className="font-label-md text-label-md text-primary hover:underline"
            >
              Créer une référence simple
            </Link>
          ) : (
            <span
              title="Permission article:create requise"
              className="cursor-not-allowed font-label-md text-label-md text-on-surface-variant/50"
            >
              Créer une référence simple
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-md p-md">
          <div className="min-w-[16rem] flex-1">
            <Input
              icon="search"
              placeholder="Rechercher un article ou un format..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Rechercher un article"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ArticleStatusFilter)}>
            <option value="ACTIVE">Statut : Actifs</option>
            <option value="ARCHIVED">Statut : Archivés</option>
            <option value="ALL">Statut : Tous</option>
          </Select>
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Nom de l'article
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Formats
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Quantité totale
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Valeur totale
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Alerte
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Statut
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
                    <td className="px-lg py-md" colSpan={7}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={7}>
                    {getApiErrorMessage(error, 'Impossible de charger le catalogue.')}
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={7}
                  >
                    Aucun article ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const visibleFormats = article.formats.slice(0, 2);
                  const extraFormats = article.formats.length - visibleFormats.length;

                  return (
                    <tr key={article.id} className="group transition-colors hover:bg-surface-container">
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-sm">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                            <Icon name="inventory_2" className="text-[20px]" />
                          </div>
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            {article.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-sm">
                        {article.formats.length === 0 ? (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-xs">
                            {visibleFormats.map((format) => (
                              <span
                                key={format}
                                className="rounded bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm uppercase text-on-secondary-container"
                              >
                                {format}
                              </span>
                            ))}
                            {extraFormats > 0 && (
                              <span className="rounded bg-surface-container-highest px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                +{extraFormats}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                        {article.quantiteTotale}
                      </td>
                      <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface-variant">
                        {formatCurrency(article.valeurTotale)}
                      </td>
                      <td className="px-lg py-sm">
                        {article.enAlerte ? (
                          <span className="inline-flex items-center gap-xs rounded-full bg-error-container px-sm py-xs font-label-sm text-label-sm text-on-error-container">
                            <Icon name="warning" className="text-[14px]" />
                            En alerte
                          </span>
                        ) : (
                          <span className="font-label-sm text-label-sm italic text-on-surface-variant">Aucune</span>
                        )}
                      </td>
                      <td className="px-lg py-sm">
                        {article.isArchived ? (
                          <span className="inline-flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
                            <span className="h-2 w-2 rounded-full bg-outline" />
                            Archivé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-xs font-label-md text-label-md text-primary">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-sm text-right">
                        <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                          <Link
                            to={`/articles/${article.id}`}
                            title="Voir"
                            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                          >
                            <Icon name="visibility" className="text-[20px]" />
                          </Link>
                          {article.isArchived ? (
                            <>
                              <button
                                type="button"
                                title={canUpdate ? 'Restaurer' : 'Permission article:update requise'}
                                disabled={!canUpdate}
                                onClick={() => setRestoring(article)}
                                className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Icon name="unarchive" className="text-[20px]" />
                              </button>
                              <button
                                type="button"
                                title={canDelete ? 'Supprimer définitivement' : 'Permission article:delete requise'}
                                disabled={!canDelete}
                                onClick={() => setDeleting(article)}
                                className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Icon name="delete" className="text-[20px]" />
                              </button>
                            </>
                          ) : (
                            <>
                              {canUpdate ? (
                                <Link
                                  to={`/articles/${article.id}/edit`}
                                  title="Modifier"
                                  className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                                >
                                  <Icon name="edit" className="text-[20px]" />
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  title="Permission article:update requise"
                                  disabled
                                  className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Icon name="edit" className="text-[20px]" />
                                </button>
                              )}
                              <button
                                type="button"
                                title={canDelete ? 'Archiver' : 'Permission article:delete requise'}
                                disabled={!canDelete}
                                onClick={() => setArchiving(article)}
                                className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Icon name="archive" className="text-[20px]" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/30 p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} références
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

      <ArchiveArticleDialog article={archiving} onClose={() => setArchiving(null)} onArchived={() => setArchiving(null)} />
      <RestoreArticleDialog article={restoring} onClose={() => setRestoring(null)} onRestored={() => setRestoring(null)} />
      <DeleteArticleDialog article={deleting} onClose={() => setDeleting(null)} onDeleted={() => setDeleting(null)} />
    </>
  );
}
