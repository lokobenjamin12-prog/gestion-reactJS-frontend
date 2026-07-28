import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArticleQuery } from '../api/articles.queries';
import { ArchiveArticleDialog } from '../components/ArchiveArticleDialog';
import { RestoreArticleDialog } from '../components/RestoreArticleDialog';
import { formatCurrency, getAlertBadgeClass, getGlobalAlertLevel } from '../lib/articleDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading, isError, error } = useArticleQuery(id ?? '');
  const canUpdate = usePermission('article:update');
  const canCreateCategory = usePermission('category:create');
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

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

  const valeurTotale = article.detailsStock.reduce((sum, d) => sum + d.valeurEstimee, 0);
  const alerteGlobale = getGlobalAlertLevel(article.detailsStock);

  return (
    <>
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span>Stock</span>
        <span className="mx-1">/</span>
        <Link to="/articles" className="hover:text-primary">
          Articles
        </Link>
        <span className="mx-1">/</span>
        <span className="text-on-surface">{article.nom}</span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div className="flex items-center gap-md">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">{article.nom}</h2>
          {article.isArchived ? (
            <span className="rounded-full bg-outline-variant px-sm py-xs font-label-md text-label-md text-on-surface-variant">
              Archivé
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-sm py-xs font-label-md text-label-md text-emerald-800">
              Actif
            </span>
          )}
        </div>
        <div className="flex items-center gap-md">
          {article.isArchived ? (
            <Button
              title={canUpdate ? 'Restaurer' : 'Permission article:update requise'}
              disabled={!canUpdate}
              onClick={() => setRestoring(true)}
            >
              <Icon name="unarchive" />
              Restaurer
            </Button>
          ) : (
            <Button
              variant="outline"
              title={canUpdate ? 'Archiver' : 'Permission article:update requise'}
              disabled={!canUpdate}
              onClick={() => setArchiving(true)}
            >
              <Icon name="archive" />
              Archiver
            </Button>
          )}
          {canUpdate ? (
            <Link to={`/articles/${article.id}/edit`}>
              <Button>
                <Icon name="edit" />
                Modifier
              </Button>
            </Link>
          ) : (
            <Button title="Permission article:update requise" disabled>
              <Icon name="edit" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="mb-xl grid grid-cols-1 gap-gutter md:grid-cols-3">
        <div className="flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <Icon name="inventory_2" />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Quantité totale</p>
            <p className="font-headline-lg text-[22px] font-bold text-on-surface">{article.quantiteTotale}</p>
          </div>
        </div>
        <div className="flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant">
            <Icon name="payments" />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Valeur totale</p>
            <p className="font-headline-lg text-[22px] font-bold text-on-surface">{formatCurrency(valeurTotale)}</p>
          </div>
        </div>
        <div className="flex items-center gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getAlertBadgeClass(alerteGlobale)}`}>
            <Icon name={alerteGlobale === 'NORMAL' ? 'check_circle' : 'warning'} />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">Alerte de stock</p>
            <p className="font-headline-lg text-[22px] font-bold text-on-surface">{alerteGlobale}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
          <h3 className="font-title-md text-title-md text-on-surface">Formats & Stock</h3>
        </div>

        {article.detailsStock.length === 0 ? (
          <div className="flex flex-col items-center gap-sm py-24 text-center">
            <Icon name="category" className="text-[48px] text-outline opacity-30" />
            <p className="mb-md font-body-md text-body-md text-on-surface-variant">
              Aucun format défini pour cet article.
            </p>
            {canCreateCategory && (
              <Link to={`/categories/new?articleId=${article.id}`}>
                <Button>
                  <Icon name="add" />
                  Créer un premier format
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-lg py-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    Format
                  </th>
                  <th className="px-lg py-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    Prix unitaire
                  </th>
                  <th className="px-lg py-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    Quantité
                  </th>
                  <th className="px-lg py-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    Niveau d'alerte
                  </th>
                  <th className="px-lg py-sm text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    Valeur estimée
                  </th>
                  <th className="px-lg py-sm" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {article.detailsStock.map((format) => (
                  <tr key={format.stockId} className="transition-colors hover:bg-surface-container">
                    <td className="px-lg py-md font-body-md text-body-md font-medium text-on-surface">
                      {format.format}
                    </td>
                    <td className="px-lg py-md font-label-md text-label-md text-on-surface-variant">
                      {formatCurrency(format.prixUnite)}
                    </td>
                    <td className="px-lg py-md font-label-md text-label-md text-on-surface-variant">
                      {format.quantite}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`inline-flex items-center rounded px-xs py-0.5 font-label-sm text-label-sm font-bold ${getAlertBadgeClass(format.niveauAlerte)}`}
                      >
                        {format.niveauAlerte}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right font-label-md text-label-md font-semibold text-on-surface">
                      {formatCurrency(format.valeurEstimee)}
                    </td>
                    <td className="px-lg py-md text-right">
                      <button
                        type="button"
                        title="Bientôt disponible"
                        disabled
                        className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="more_vert" className="text-[20px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {article.detailsStock.length > 0 && (
          <div className="border-t border-outline-variant px-lg py-md">
            {canCreateCategory ? (
              <Link
                to={`/categories/new?articleId=${article.id}`}
                className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
              >
                <Icon name="add" className="text-[18px]" />
                Ajouter un format
              </Link>
            ) : (
              <span
                title="Permission category:create requise"
                className="flex cursor-not-allowed items-center gap-xs font-label-md text-label-md text-on-surface-variant/50"
              >
                <Icon name="add" className="text-[18px]" />
                Ajouter un format
              </span>
            )}
          </div>
        )}
      </div>

      <ArchiveArticleDialog
        article={archiving ? article : null}
        onClose={() => setArchiving(false)}
        onArchived={() => setArchiving(false)}
      />
      <RestoreArticleDialog
        article={restoring ? article : null}
        onClose={() => setRestoring(false)}
        onRestored={() => setRestoring(false)}
      />
    </>
  );
}
