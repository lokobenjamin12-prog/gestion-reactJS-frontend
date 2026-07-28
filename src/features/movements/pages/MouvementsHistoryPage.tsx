import { useEffect, useState } from 'react';
import { useMouvementsHistoryQuery, useStockOverviewQuery } from '../api/movements.queries';
import { formatDateTime, getMovementTypeBadgeClass } from '../lib/movementDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function MouvementsHistoryPage() {
  const [articleStockId, setArticleStockId] = useState('');
  const [page, setPage] = useState(1);

  const { data: stocksData } = useStockOverviewQuery();

  useEffect(() => {
    setPage(1);
  }, [articleStockId]);

  const { data, isLoading, isError, error } = useMouvementsHistoryQuery({
    articleStockId: articleStockId || undefined,
    page,
    limit: 10,
  });

  const movements = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span>Stock</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Historique</span>
      </nav>

      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Historique des mouvements</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Consultez l'ensemble des flux de stock et ajustements d'inventaire.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Select value={articleStockId} onChange={(e) => setArticleStockId(e.target.value)} className="min-w-[16rem]">
            <option value="">Tous les articles</option>
            {stocksData?.map((s) => (
              <option key={s.stockId} value={s.stockId}>
                {s.nomArticle} — {s.categoryNom}
              </option>
            ))}
          </Select>
          {articleStockId && (
            <button
              type="button"
              title="Réinitialiser le filtre"
              onClick={() => setArticleStockId('')}
              className="rounded p-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              <Icon name="filter_alt_off" className="text-[20px]" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Date
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Article
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Format
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Type
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Quantité
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Avant → Après
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Motif
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Auteur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-lg py-md" colSpan={8}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={8}>
                    {getApiErrorMessage(error, "Impossible de charger l'historique des mouvements.")}
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={8}
                  >
                    Aucun mouvement ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-surface-container">
                    <td className="whitespace-nowrap px-lg py-sm font-label-sm text-label-sm text-on-surface-variant">
                      {formatDateTime(m.date)}
                    </td>
                    <td className="px-lg py-sm font-body-md text-body-md font-medium text-on-surface">
                      {m.articleNom}
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                      {m.categoryNom}
                    </td>
                    <td className="px-lg py-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-sm py-1 font-label-sm text-label-sm font-bold ${getMovementTypeBadgeClass(m.type)}`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface">
                      {m.type === 'ENTREE' ? '+' : m.type === 'AJUSTEMENT' ? '' : '-'}
                      {m.quantite}
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface-variant">
                      {m.avant} → {m.apres}
                    </td>
                    <td className="max-w-[16rem] truncate px-lg py-sm font-body-sm text-body-sm italic text-on-surface-variant">
                      {m.motif}
                    </td>
                    <td className="px-lg py-sm">
                      {m.isSystem ? (
                        <span className="inline-flex items-center gap-xs rounded-lg border border-outline-variant bg-surface-container-highest px-sm py-1 font-label-sm text-label-sm text-on-surface-variant">
                          <Icon name="settings_suggest" className="text-[14px]" />
                          Système
                        </span>
                      ) : (
                        <span className="font-label-md text-label-md text-on-surface">{m.auteur}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/30 p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Page {meta.currentPage} sur {meta.totalPages}
              <span className="mx-sm text-outline-variant">|</span>
              Total : {meta.totalItems} mouvement{meta.totalItems > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={meta.currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                type="button"
                disabled={meta.currentPage >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
