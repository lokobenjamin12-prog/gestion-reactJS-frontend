import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionQuery } from '../api/sessions.queries';
import { CancelSessionDialog } from '../components/CancelSessionDialog';
import { CloseSessionDialog } from '../components/CloseSessionDialog';
import { formatArticle, formatCurrency, formatHeure, formatJourOuverture, formatUserName, getStatusBadgeClass } from '../lib/sessionDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, isError, error } = useSessionQuery(id ?? '');
  const canUpdate = usePermission('salessession:update');
  const [cancelling, setCancelling] = useState(false);
  const [closing, setClosing] = useState(false);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !session) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger cette session.')}
      </div>
    );
  }

  const isOpen = session.status === 'OPEN';
  const isClosed = session.status === 'CLOSED';

  return (
    <>
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <Link to="/sessions" className="hover:text-primary">
          Sessions
        </Link>
        <span className="mx-1">/</span>
        <span className="text-on-surface">
          {formatUserName(session.commercial)} — {formatJourOuverture(session.jourOuverture)}
        </span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-sm">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Détail de la session</h2>
            <span
              className={`rounded-full px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getStatusBadgeClass(session.status)}`}
            >
              {session.status}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Commercial : <span className="font-semibold text-on-surface">{formatUserName(session.commercial)}</span>
            {' • '}
            Manager : <span className="font-semibold text-on-surface">{formatUserName(session.manager)}</span>
            {' • '}
            {formatArticle(session.article)}
          </p>
        </div>
        {isOpen && (
          <div className="flex items-center gap-md">
            <Button
              variant="outline"
              title={canUpdate ? 'Annuler' : 'Permission salessession:update requise'}
              disabled={!canUpdate}
              onClick={() => setCancelling(true)}
            >
              <Icon name="cancel" />
              Annuler la session
            </Button>
            <Button
              title={canUpdate ? 'Clôturer' : 'Permission salessession:update requise'}
              disabled={!canUpdate}
              onClick={() => setClosing(true)}
            >
              <Icon name="task_alt" />
              Clôturer la session
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Départ */}
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-4">
          <div>
            <div className="mb-md flex items-center gap-xs text-primary">
              <Icon name="north_east" />
              <h3 className="font-title-md text-title-md font-bold uppercase tracking-wider">Départ</h3>
            </div>
            <div className="mt-lg space-y-lg">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Quantité de départ
                </span>
                <span className="font-headline-lg text-headline-lg text-primary">{session.quantiteDepart}</span>
              </div>
              <div className="grid grid-cols-2 gap-md border-t border-dashed border-outline-variant pt-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Heure
                  </span>
                  <span className="font-title-md text-title-md font-semibold">{formatHeure(session.heureDepart)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Jour
                  </span>
                  <span className="font-title-md text-title-md font-semibold">
                    {formatJourOuverture(session.jourOuverture)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retour & Finances */}
        {isClosed ? (
          <>
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-4">
              <div className="mb-md flex items-center gap-xs text-primary">
                <Icon name="assignment_return" />
                <h3 className="font-title-md text-title-md font-bold uppercase tracking-wider">Retour</h3>
              </div>
              <div className="space-y-md">
                <div className="flex items-end justify-between border-b border-outline-variant pb-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant">Quantité retournée</span>
                  <span className="font-title-lg text-title-lg font-bold">{session.quantiteRetour}</span>
                </div>
                <div className="flex items-end justify-between border-b border-outline-variant pb-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant">Quantité vendue</span>
                  <span className="font-title-lg text-title-lg font-bold text-primary">{session.quantiteVendue}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant">Heure de retour</span>
                  <span className="font-title-md text-title-md font-semibold">
                    {session.heureRetour ? formatHeure(session.heureRetour) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-4">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface p-lg">
                <div className="flex items-center gap-xs text-primary">
                  <Icon name="payments" />
                  <h3 className="font-title-md text-title-md font-bold uppercase tracking-wider">Finances</h3>
                </div>
                <div className="flex items-center gap-xs rounded-full bg-emerald-100 px-sm py-1 text-emerald-800">
                  <Icon name="check_circle" className="text-[16px]" />
                  <span className="font-label-sm text-label-sm font-bold uppercase">
                    Écart : {session.ecartCaisse !== null ? formatCurrency(session.ecartCaisse) : '—'}
                  </span>
                </div>
              </div>
              <div className="space-y-md p-lg">
                <div className="grid grid-cols-2 gap-lg">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                      CA théorique
                    </span>
                    <span className="font-title-lg text-title-lg font-bold">
                      {session.chiffreAffaireTheorique !== null ? formatCurrency(session.chiffreAffaireTheorique) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                      Total reçu
                    </span>
                    <span className="font-title-lg text-title-lg font-bold text-primary">
                      {session.totalVentesRecues !== null ? formatCurrency(session.totalVentesRecues) : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container p-md">
                  <span className="font-label-md text-label-md text-on-surface-variant">Dépenses totales</span>
                  <span className="font-title-md text-title-md font-bold text-error">
                    {formatCurrency(session.totalDepenses)}
                  </span>
                </div>
                {session.depenses.length > 0 && (
                  <div className="border-t border-outline-variant pt-md">
                    <span className="mb-sm block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                      Détail des dépenses
                    </span>
                    <ul className="space-y-1">
                      {session.depenses.map((d, i) => (
                        <li
                          key={i}
                          className="flex justify-between border-b border-outline-variant/30 py-xs font-body-md text-body-md"
                        >
                          <span>{d.motif}</span>
                          <span className="font-semibold">{formatCurrency(d.montant)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-md rounded-xl border border-outline-variant bg-surface-container p-lg text-center opacity-60 lg:col-span-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
              <Icon name="hourglass_empty" className="text-[32px] text-on-surface-variant" />
            </div>
            <h3 className="font-title-md text-title-md font-bold uppercase tracking-wider text-on-surface-variant">
              Retour &amp; Finances
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isOpen
                ? 'Ces informations seront disponibles une fois la session clôturée.'
                : 'Session annulée — aucune donnée de retour ni flux financier.'}
            </p>
          </div>
        )}
      </div>

      <CancelSessionDialog
        session={
          cancelling
            ? { id: session.id, commercialNom: formatUserName(session.commercial) }
            : null
        }
        onClose={() => setCancelling(false)}
        onCancelled={() => setCancelling(false)}
      />

      <CloseSessionDialog
        session={
          closing
            ? {
                id: session.id,
                commercialNom: formatUserName(session.commercial),
                quantiteDepart: session.quantiteDepart,
                prixUnite: session.article.prixUnite,
              }
            : null
        }
        onClose={() => setClosing(false)}
        onClosed={() => setClosing(false)}
      />
    </>
  );
}
