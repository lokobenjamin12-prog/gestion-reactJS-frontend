import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStockAlertsQuery } from '../api/movements.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function StockAlertsPage() {
  const { data, isLoading, isError, error } = useStockAlertsQuery();
  const [searchInput, setSearchInput] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const canCreate = usePermission('movement:create');

  const alerts = data ?? [];

  const filtered = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    return alerts.filter((a) => {
      if (urgentOnly && !a.isUrgent) return false;
      if (!query) return true;
      return a.nomArticle.toLowerCase().includes(query) || a.format.toLowerCase().includes(query);
    });
  }, [alerts, searchInput, urgentOnly]);

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Stock</span>
      </nav>

      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Alertes de stock</h2>
          <div className="mt-1 flex items-center gap-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-error" />
            <p className="font-body-md text-body-md text-on-surface-variant">
              <span className="font-bold text-error">{alerts.length}</span> alerte{alerts.length > 1 ? 's' : ''}{' '}
              active{alerts.length > 1 ? 's' : ''} nécessitant une action
            </p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="w-64">
            <Input
              icon="search"
              placeholder="Rechercher une alerte..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Rechercher une alerte"
            />
          </div>
          <label className="flex h-10 cursor-pointer items-center gap-sm px-md">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) => setUrgentOnly(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">Urgents uniquement</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="py-xl text-center text-on-surface-variant">Chargement…</div>
      ) : isError ? (
        <div className="py-xl text-center text-error">
          {getApiErrorMessage(error, 'Impossible de charger les alertes de stock.')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-sm py-24 text-center">
          <Icon name="check_circle" className="text-[48px] text-outline opacity-30" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            {alerts.length === 0 ? 'Aucune alerte active — tous les stocks sont à un niveau normal.' : 'Aucune alerte ne correspond à ces critères.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`relative flex flex-col gap-md overflow-hidden rounded-xl p-lg transition-shadow hover:shadow-md ${
                alert.isUrgent
                  ? 'border-2 border-error-container bg-surface-container-lowest'
                  : 'border border-outline-variant bg-surface-container-lowest'
              }`}
            >
              {alert.isUrgent && (
                <span className="absolute right-md top-md rounded bg-error px-sm py-1 font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-error">
                  Urgent
                </span>
              )}
              <div className="flex items-start gap-md pr-xl">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    alert.isUrgent ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                  }`}
                >
                  <Icon name="warning" filled={alert.isUrgent} />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md leading-tight text-on-surface">{alert.nomArticle}</h3>
                  <p className="font-label-md text-label-md text-on-surface-variant">Format : {alert.format}</p>
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant">Quantité actuelle</span>
                  <span className={`font-body-md text-body-md font-bold ${alert.isUrgent ? 'text-error' : 'text-on-tertiary-fixed-variant'}`}>
                    {alert.quantiteActuelle} unité{alert.quantiteActuelle > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-lg border-l-4 p-sm ${
                  alert.isUrgent ? 'border-error bg-error/5' : 'border-outline bg-surface-container-high'
                }`}
              >
                <p className={`font-body-sm text-body-sm ${alert.isUrgent ? 'text-on-error-container' : 'text-on-surface-variant'}`}>
                  <span className="font-bold">Logistique : </span>
                  {alert.messageLogistique}
                </p>
              </div>

              <div className="mt-auto flex gap-sm pt-sm">
                <button
                  type="button"
                  title="Bientôt disponible"
                  disabled
                  className="flex-1 rounded-lg border border-outline-variant py-2 font-label-md text-label-md text-outline disabled:cursor-not-allowed"
                >
                  Détails
                </button>
                {canCreate ? (
                  <Link
                    to={`/mouvements-stock/new?articleStockId=${alert.id}`}
                    className="flex-1 rounded-lg bg-primary py-2 text-center font-label-md text-label-md text-on-primary hover:opacity-90"
                  >
                    Réappro.
                  </Link>
                ) : (
                  <button
                    type="button"
                    title="Permission movement:create requise"
                    disabled
                    className="flex-1 rounded-lg bg-surface-container-highest py-2 font-label-md text-label-md text-outline disabled:cursor-not-allowed"
                  >
                    Réappro.
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
