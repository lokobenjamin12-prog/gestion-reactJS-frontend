import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStockOverviewQuery } from '../api/movements.queries';
import { formatCurrency, getAlertBadgeClass } from '../lib/movementDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

const PAGE_SIZE = 10;

export function StockOverviewPage() {
  const { data, isLoading, isError, error } = useStockOverviewQuery();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const canCreate = usePermission('movement:create');

  const stocks = data ?? [];

  const filtered = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return stocks;
    return stocks.filter(
      (s) => s.nomArticle.toLowerCase().includes(query) || s.categoryNom.toLowerCase().includes(query),
    );
  }, [stocks, searchInput]);

  // Agrégats réels calculés côté client à partir de la liste complète
  // renvoyée par GET /movement-stock/get-stocks (pas de pagination serveur
  // sur cet endpoint) — pas de fabrication, juste une somme/un comptage.
  const valeurTotale = useMemo(() => stocks.reduce((sum, s) => sum + s.valeurStock, 0), [stocks]);
  const nbCritiques = useMemo(() => stocks.filter((s) => s.niveauAlerte === 'CRITIQUE').length, [stocks]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Stock</span>
      </nav>

      <div className="mb-lg flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Vue d'ensemble des stocks</h2>
          <div className="mt-xs flex items-center gap-md">
            <Link
              to="/mouvements-stock/alertes"
              className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
            >
              <Icon name="warning" className="text-[18px]" />
              Voir les alertes
            </Link>
            <span className="text-outline-variant">•</span>
            <Link
              to="/mouvements-stock/historique"
              className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
            >
              <Icon name="history" className="text-[18px]" />
              Voir l'historique
            </Link>
          </div>
        </div>
        {canCreate ? (
          <Link to="/mouvements-stock/new">
            <Button>
              <Icon name="add" />
              Nouveau mouvement
            </Button>
          </Link>
        ) : (
          <Button title="Permission movement:create requise" disabled>
            <Icon name="add" />
            Nouveau mouvement
          </Button>
        )}
      </div>

      <div className="mb-lg grid grid-cols-1 gap-gutter md:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <span className="font-label-md text-label-md text-on-surface-variant">Valeur totale du stock</span>
          <span className="font-headline-lg text-[24px] font-bold text-primary">{formatCurrency(valeurTotale)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <span className="font-label-md text-label-md text-on-surface-variant">Formats en stock critique</span>
          <span className="font-headline-lg text-[24px] font-bold text-error">{nbCritiques}</span>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        <div className="p-md">
          <Input
            icon="search"
            placeholder="Rechercher un article ou un format..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            aria-label="Rechercher un stock"
          />
        </div>

        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Article
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Format
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Prix unitaire
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Quantité
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Valeur du stock
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Niveau
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
                    {getApiErrorMessage(error, 'Impossible de charger la vue d\'ensemble des stocks.')}
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={7}
                  >
                    Aucun stock ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                pageItems.map((stock) => (
                  <tr key={stock.stockId} className="group transition-colors hover:bg-surface-container">
                    <td className="px-lg py-sm font-body-md text-body-md font-semibold text-on-surface">
                      {stock.nomArticle}
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                      {stock.categoryNom}
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface-variant">
                      {formatCurrency(stock.prixUnitaireCategory)}
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface-variant">
                      {stock.quantite}
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md font-semibold text-on-surface">
                      {formatCurrency(stock.valeurStock)}
                    </td>
                    <td className="px-lg py-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getAlertBadgeClass(stock.niveauAlerte)}`}
                      >
                        {stock.niveauAlerte}
                      </span>
                    </td>
                    <td className="px-lg py-sm text-right">
                      {canCreate ? (
                        <Link
                          to={`/mouvements-stock/new?articleStockId=${stock.stockId}`}
                          title="Nouveau mouvement"
                          className="inline-flex rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                        >
                          <Icon name="swap_horiz" className="text-[20px]" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          title="Permission movement:create requise"
                          disabled
                          className="rounded p-xs text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icon name="swap_horiz" className="text-[20px]" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-high/30 p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Affichage de {rangeStart}-{rangeEnd} sur {filtered.length} article{filtered.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
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
