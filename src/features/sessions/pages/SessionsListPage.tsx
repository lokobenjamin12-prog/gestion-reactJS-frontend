import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionsListQuery } from '../api/sessions.queries';
import { CancelSessionDialog } from '../components/CancelSessionDialog';
import { CloseSessionDialog } from '../components/CloseSessionDialog';
import { formatArticle, formatJourOuverture, formatUserName, getStatusBadgeClass } from '../lib/sessionDisplay';
import type { SessionStatus, SessionSummary } from '../types/session.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const STATUS_OPTIONS: { value: SessionStatus | ''; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'OPEN', label: 'Ouvertes' },
  { value: 'CLOSED', label: 'Clôturées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export function SessionsListPage() {
  const [status, setStatus] = useState<SessionStatus | ''>('');
  const [jourOuverture, setJourOuverture] = useState('');
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<SessionSummary | null>(null);
  const [closing, setClosing] = useState<SessionSummary | null>(null);

  const canCreate = usePermission('salessession:create');
  const canUpdate = usePermission('salessession:update');

  useEffect(() => {
    setPage(1);
  }, [status, jourOuverture]);

  const { data, isLoading, isError, error } = useSessionsListQuery({
    status: status || undefined,
    jourOuverture: jourOuverture || undefined,
    page,
    limit: 10,
  });

  const sessions = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Sessions commerciales</span>
      </nav>

      <div className="mb-lg flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Sessions commerciales</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Suivi des courses et ventes terrain</p>
        </div>
        {canCreate ? (
          <Link to="/sessions/new">
            <Button>
              <Icon name="add" />
              Ouvrir une session
            </Button>
          </Link>
        ) : (
          <Button title="Permission salessession:create requise" disabled>
            <Icon name="add" />
            Ouvrir une session
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-md p-md">
          <div className="flex items-center gap-sm">
            <label className="font-label-md text-label-md text-on-surface-variant">Statut :</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as SessionStatus | '')}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-sm">
            <label className="font-label-md text-label-md text-on-surface-variant">Jour d'ouverture :</label>
            <input
              type="date"
              value={jourOuverture}
              onChange={(e) => setJourOuverture(e.target.value)}
              className="rounded-lg border border-outline-variant bg-white px-md py-sm font-label-md text-label-md text-on-surface-variant outline-none focus:border-primary"
            />
          </div>
          {(status || jourOuverture) && (
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setJourOuverture('');
              }}
              className="ml-auto rounded-lg px-md py-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Tableau */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-container-high">
              <tr>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Commercial
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Article / Format
                </th>
                <th className="border-b border-outline-variant px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Qté départ
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Statut
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Ouverture
                </th>
                <th className="border-b border-outline-variant px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Manager
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
                    {getApiErrorMessage(error, 'Impossible de charger les sessions commerciales.')}
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={7}
                  >
                    Aucune session ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="group transition-colors hover:bg-surface-container">
                    <td className="px-lg py-sm">
                      <div className="flex items-center gap-sm">
                        <Avatar
                          firstName={session.commercial.firstName}
                          lastName={session.commercial.lastName}
                          src={session.commercial.profilePicture}
                          className="h-8 w-8 font-label-sm text-label-sm font-bold"
                        />
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {formatUserName(session.commercial)}
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-sm font-body-md text-body-md">
                      {formatArticle(session.article)}
                    </td>
                    <td className="px-lg py-sm text-right font-label-md text-label-md text-on-surface-variant">
                      {session.quantiteDepart}
                    </td>
                    <td className="px-lg py-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getStatusBadgeClass(session.status)}`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">
                      {formatJourOuverture(session.jourOuverture)}
                    </td>
                    <td className="px-lg py-sm font-body-md text-body-md">
                      {formatUserName(session.manager)}
                    </td>
                    <td className="px-lg py-sm text-right">
                      <div className="flex items-center justify-end gap-xs opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          to={`/sessions/${session.id}`}
                          title="Voir"
                          className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
                        >
                          <Icon name="visibility" className="text-[20px]" />
                        </Link>
                        {session.status === 'OPEN' && (
                          <>
                            <button
                              type="button"
                              title={canUpdate ? 'Clôturer' : 'Permission salessession:update requise'}
                              disabled={!canUpdate}
                              onClick={() => setClosing(session)}
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="task_alt" className="text-[20px]" />
                            </button>
                            <button
                              type="button"
                              title={canUpdate ? 'Annuler' : 'Permission salessession:update requise'}
                              disabled={!canUpdate}
                              onClick={() =>
                                setCancelling(session)
                              }
                              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="cancel" className="text-[20px]" />
                            </button>
                          </>
                        )}
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
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} session{meta.total > 1 ? 's' : ''}
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
                Page {meta.page} / {meta.lastPage}
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

      <CancelSessionDialog
        session={
          cancelling
            ? { id: cancelling.id, commercialNom: formatUserName(cancelling.commercial) }
            : null
        }
        onClose={() => setCancelling(null)}
        onCancelled={() => setCancelling(null)}
      />

      <CloseSessionDialog
        session={
          closing
            ? {
                id: closing.id,
                commercialNom: formatUserName(closing.commercial),
                quantiteDepart: closing.quantiteDepart,
                prixUnite: closing.article.prixUnite,
              }
            : null
        }
        onClose={() => setClosing(null)}
        onClosed={() => setClosing(null)}
      />
    </>
  );
}
