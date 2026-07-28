import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContratExpirationsQuery } from '../api/contrats.queries';
import { formatDate, getDaysRemaining, getUrgencyBadge } from '../lib/contratDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Icon } from '@/shared/ui/Icon';

export function ContratExpirationsPage() {
  const [delai, setDelai] = useState(30);
  const { data: contrats, isLoading, isError, error } = useContratExpirationsQuery(delai);
  const canCreate = usePermission('contrat:create');

  const withDays = (contrats ?? [])
    .filter((c) => c.dateFin)
    .map((c) => ({ contrat: c, joursRestants: getDaysRemaining(c.dateFin!) }));

  const critiques = withDays.filter((c) => c.joursRestants < 7).length;
  const urgents = withDays.filter((c) => c.joursRestants >= 7 && c.joursRestants < 15).length;
  const aSurveiller = withDays.filter((c) => c.joursRestants >= 15).length;

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-center">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/contrats" className="hover:text-primary">
              Contrats
            </Link>
            <span className="mx-1">/</span>
            <span className="text-on-surface">Alertes CDD</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">Alertes CDD</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Expirations proches des contrats à durée déterminée
          </p>
        </div>
        <div className="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container-low p-md shadow-sm">
          <div className="flex flex-col">
            <label htmlFor="delai" className="font-label-sm text-label-sm text-outline">
              Seuil d'alerte (jours)
            </label>
            <input
              id="delai"
              type="number"
              min={1}
              value={delai}
              onChange={(e) => setDelai(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 border-none bg-transparent p-0 font-title-md text-title-md focus:ring-0"
            />
          </div>
          <Icon name="tune" className="rounded-lg bg-primary-container p-xs text-primary" />
        </div>
      </div>

      {/* Résumé */}
      <div className="mb-lg grid grid-cols-1 gap-md md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-lg border-l-4 border-error bg-surface-container-low p-md">
          <span className="font-label-md text-label-md text-outline">CRITIQUE (&lt; 7j)</span>
          <span className="font-display-lg text-display-lg text-error">{String(critiques).padStart(2, '0')}</span>
        </div>
        <div className="flex flex-col justify-between rounded-lg border-l-4 border-on-tertiary-container bg-surface-container-low p-md">
          <span className="font-label-md text-label-md text-outline">URGENT (&lt; 15j)</span>
          <span className="font-display-lg text-display-lg text-on-tertiary-container">
            {String(urgents).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-lg border-l-4 border-on-secondary-container bg-surface-container-low p-md">
          <span className="font-label-md text-label-md text-outline">À SURVEILLER (&lt; {delai}j)</span>
          <span className="font-display-lg text-display-lg text-on-secondary-container">
            {String(aSurveiller).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-sm">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container" />
          ))
        ) : isError ? (
          <p className="py-lg text-center font-body-sm text-body-sm text-error">
            {getApiErrorMessage(error, 'Impossible de charger les alertes CDD.')}
          </p>
        ) : withDays.length === 0 ? (
          <div className="flex flex-col items-center gap-md py-xl text-center">
            <div className="rounded-full bg-surface-container-high p-lg">
              <Icon name="event_busy" className="text-[48px] text-outline" />
            </div>
            <h3 className="font-title-md text-title-md text-on-surface">Aucun CDD à échéance</h3>
            <p className="max-w-[20rem] font-body-sm text-body-sm text-on-surface-variant">
              Aucun contrat n'arrive à échéance dans le délai de {delai} jours sélectionné.
            </p>
          </div>
        ) : (
          withDays
            .sort((a, b) => a.joursRestants - b.joursRestants)
            .map(({ contrat, joursRestants }) => {
              const urgency = getUrgencyBadge(joursRestants);
              return (
                <Link
                  key={contrat.id}
                  to={`/contrats/${contrat.id}`}
                  className="group flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-md transition-all hover:bg-surface-container"
                >
                  <div className="flex items-center gap-md">
                    <Avatar
                      firstName={contrat.user.firstName}
                      lastName={contrat.user.lastName}
                      src={contrat.user.profilePicture}
                      className="h-12 w-12 border border-outline-variant font-bold"
                    />
                    <div className="flex flex-col">
                      <h3 className="font-title-md text-title-md text-on-surface">
                        {contrat.user.firstName} {contrat.user.lastName}
                      </h3>
                      <div className="mt-xs flex items-center gap-sm">
                        <Icon name="calendar_today" className="text-[16px] text-outline" />
                        <span className="font-label-md text-label-md uppercase text-on-surface-variant">
                          Fin : {formatDate(contrat.dateFin)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-xl">
                    <div className="hidden flex-col items-end md:flex">
                      <span className={`font-label-md text-label-md font-bold ${urgency.valueClassName}`}>
                        {joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''}
                      </span>
                      <span
                        className={`mt-xs rounded-full px-sm py-[2px] font-label-sm text-label-sm ${urgency.badgeClassName}`}
                      >
                        {urgency.label.toUpperCase()}
                      </span>
                    </div>
                    <Icon
                      name="chevron_right"
                      className="text-outline transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })
        )}
      </div>

      {canCreate && (
        <Link
          to="/contrats/new"
          title="Nouveau contrat"
          className="fixed bottom-lg right-lg z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg transition-all hover:scale-110 active:scale-95"
        >
          <Icon name="add" />
        </Link>
      )}
    </>
  );
}
