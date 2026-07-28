import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSalaireQuery, useGenererFicheDePaieMutation, useTelechargerFicheMutation } from '../api/salaires.queries';
import { CloturerMoisDialog } from '../components/CloturerMoisDialog';
import { AjouterPrimeDialog } from '../components/AjouterPrimeDialog';
import { SupprimerPrimeDialog } from '../components/SupprimerPrimeDialog';
import { VersementDialog } from '../components/VersementDialog';
import { formatPeriode, formatCurrency, formatDate } from '../lib/salaireDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function SalaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fiche, isLoading, isError, error } = useSalaireQuery(id!);
  const canUpdate = usePermission('salaire:update');

  const [cloturerOpen, setCloturerOpen] = useState(false);
  const [ajouterPrimeOpen, setAjouterPrimeOpen] = useState(false);
  const [deletingPrime, setDeletingPrime] = useState<{ index: number; somme: number; raison: string } | null>(null);
  const [versementOpen, setVersementOpen] = useState(false);
  const [jourDePaie, setJourDePaie] = useState('');

  const genererFicheMutation = useGenererFicheDePaieMutation();
  const telechargerMutation = useTelechargerFicheMutation();

  const errorRef = useScrollToError(genererFicheMutation.isError || telechargerMutation.isError);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !fiche) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger cette fiche de salaire.')}
      </div>
    );
  }

  function handleDownload() {
    if (!fiche) return;
    telechargerMutation.mutate(fiche.id, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fiche_paie_${fiche.user.firstName}_${fiche.user.lastName}_${String(fiche.mois).padStart(2, '0')}-${fiche.annee}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
    });
  }

  function handleGenererFiche() {
    if (!fiche || !jourDePaie) return;
    genererFicheMutation.mutate({ id: fiche.id, payload: { jourDePaie } });
  }

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/salaires" className="hover:text-primary">
              Salaires
            </Link>
            <span className="mx-1">/</span>
            <span>{fiche.user.firstName} {fiche.user.lastName}</span>
            <span className="mx-1">/</span>
            <span className="text-on-surface">{formatPeriode(fiche.mois, fiche.annee)}</span>
          </nav>
          <Link
            to={`/salaires/historique/${fiche.userId}`}
            className="mb-xs inline-flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
          >
            <Icon name="history" className="text-[16px]" />
            Voir l'historique des paiements de ce collaborateur
          </Link>
          <div className="flex flex-wrap items-center gap-md">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              {fiche.user.firstName} {fiche.user.lastName}
            </h2>
            {fiche.user.role?.post && (
              <span className="rounded bg-secondary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-secondary-fixed-variant">
                {fiche.user.role.post}
              </span>
            )}
            {fiche.estCloture ? (
              <span className="inline-flex items-center gap-xs rounded bg-secondary-fixed px-md py-xs font-label-md text-label-md text-on-secondary-fixed-variant">
                <Icon name="lock" filled className="text-[16px]" />
                Clôturé
              </span>
            ) : (
              <span className="inline-flex items-center gap-xs rounded bg-surface-container-highest px-md py-xs font-label-md text-label-md text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ouvert
              </span>
            )}
          </div>
        </div>
        <Button
          variant="danger"
          title={
            !canUpdate
              ? 'Permission salaire:update requise'
              : fiche.estCloture
                ? 'Déjà clôturé'
                : 'Action irréversible : fige les données'
          }
          disabled={!canUpdate || fiche.estCloture}
          onClick={() => setCloturerOpen(true)}
        >
          <Icon name="lock" />
          Clôturer le mois
        </Button>
      </div>

      {(genererFicheMutation.isError || telechargerMutation.isError) && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">
            {getApiErrorMessage(genererFicheMutation.error ?? telechargerMutation.error)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
        {/* Base de calcul */}
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div>
            <div className="mb-lg flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface">Base de calcul</h3>
              <Icon name="calculate" className="text-on-surface-variant" />
            </div>
            <div className="space-y-md">
              <div className="flex items-center justify-between border-b border-dashed border-outline-variant pb-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Jours ouvrables</span>
                <span className="font-label-md text-label-md text-on-surface">{fiche.nbJoursOuvrables} jours</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-outline-variant pb-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Prix journalier</span>
                <span className="font-label-md text-label-md text-on-surface">
                  {formatCurrency(fiche.prixJournalier)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-xl border-t border-outline-variant pt-md">
            <p className="mb-xs font-label-sm text-label-sm uppercase text-on-surface-variant">Salaire brut</p>
            <p className="font-headline-lg text-headline-lg text-primary">{formatCurrency(fiche.salaireBrut)}</p>
          </div>
        </div>

        {/* Déductions */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div className="mb-lg flex items-center justify-between">
            <h3 className="font-title-md text-title-md text-on-surface">Déductions</h3>
            <Icon name="trending_down" className="text-error" />
          </div>
          <div className="space-y-md">
            <div>
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface">
                <span>Absences</span>
                <span className="font-label-md text-label-md">{formatCurrency(fiche.deductionAbs)}</span>
              </div>
              <div className="mt-xs flex gap-md font-label-sm text-label-sm text-on-surface-variant">
                <span>Justifiées : {fiche.nbAbsJust}</span>
                <span>Injustifiées : {fiche.nbAbsInjust}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface">
                <span>Retards</span>
                <span className="font-label-md text-label-md">{formatCurrency(fiche.deductionRetards)}</span>
              </div>
              <div className="mt-xs flex gap-md font-label-sm text-label-sm text-on-surface-variant">
                <span>Justifiés : {fiche.nbRetardsJust}</span>
                <span>Injustifiés : {fiche.nbRetardsInjust}</span>
              </div>
            </div>
            {!fiche.estCloture && (
              <div className="flex items-center gap-sm rounded bg-surface-container p-sm">
                <Icon name="info" className="text-[18px] text-on-surface-variant" />
                <span className="font-label-sm text-label-sm italic text-on-surface-variant">
                  Calculé à la clôture
                </span>
              </div>
            )}
          </div>
          {fiche.estCloture && (fiche.absence || fiche.retard) && (
            <div className="mt-lg flex gap-md border-t border-outline-variant pt-lg">
              {fiche.absence && (
                <Link
                  to={`/absences/${fiche.userId}/${fiche.mois}/${fiche.annee}`}
                  className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
                >
                  <Icon name="visibility" className="text-[16px]" />
                  Absences
                </Link>
              )}
              {fiche.retard && (
                <Link
                  to={`/retards/${fiche.userId}/${fiche.mois}/${fiche.annee}`}
                  className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
                >
                  <Icon name="visibility" className="text-[16px]" />
                  Retards
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Primes */}
        <div className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <div className="mb-lg flex items-center justify-between">
            <h3 className="font-title-md text-title-md text-on-surface">Primes</h3>
            <Icon name="military_tech" className="text-secondary" />
          </div>
          <div className="flex-grow space-y-sm">
            {fiche.primes.length === 0 ? (
              <p className="py-md text-center font-body-sm text-body-sm text-on-surface-variant">
                Aucune prime pour ce mois.
              </p>
            ) : (
              fiche.primes.map((prime, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-transparent bg-surface-container p-sm transition-all hover:border-outline-variant"
                >
                  <span className="font-label-md text-label-md text-on-surface">{prime.raison}</span>
                  <div className="flex items-center gap-md">
                    <span className="font-label-md text-label-md text-on-surface">{formatCurrency(prime.somme)}</span>
                    <button
                      type="button"
                      title={
                        !canUpdate ? 'Permission salaire:update requise' : fiche.estCloture ? 'Salaire clôturé' : 'Supprimer'
                      }
                      disabled={!canUpdate || fiche.estCloture}
                      onClick={() => setDeletingPrime({ index, somme: prime.somme, raison: prime.raison })}
                      className="rounded p-xs text-error transition-colors hover:bg-error-container/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-xl border-t border-outline-variant pt-md">
            <button
              type="button"
              title={!canUpdate ? 'Permission salaire:update requise' : fiche.estCloture ? 'Salaire clôturé' : undefined}
              disabled={!canUpdate || fiche.estCloture}
              onClick={() => setAjouterPrimeOpen(true)}
              className="flex w-full items-center justify-center gap-sm rounded-lg border-2 border-dashed border-outline-variant py-sm font-label-md text-label-md text-on-surface-variant transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="add_circle" />
              Ajouter une prime
            </button>
          </div>
        </div>
      </div>

      {/* Résultat */}
      <div className="relative mt-lg overflow-hidden rounded-xl bg-primary-container p-xl text-on-primary-container shadow-xl">
        <Icon
          name="account_balance_wallet"
          className="pointer-events-none absolute -bottom-10 -right-10 text-[200px] opacity-10"
        />
        <div className="relative z-10 flex flex-col justify-between gap-xl md:flex-row md:items-center">
          <div>
            <p className="mb-sm font-label-md text-label-md uppercase tracking-[0.2em] text-on-primary-container/80">
              {fiche.estCloture ? 'Salaire net' : 'Estimation salaire net'}
            </p>
            <h2 className="font-headline-lg text-[48px] leading-none text-white">
              {formatCurrency(fiche.salaireNet)}
            </h2>
          </div>
          <div className="flex flex-col gap-sm rounded-lg border border-white/10 bg-white/5 p-lg backdrop-blur-md md:items-end">
            <div className="flex w-full justify-between md:w-64">
              <span className="font-label-md text-white/70">Brut</span>
              <span className="font-label-md text-white">{formatCurrency(fiche.salaireBrut)}</span>
            </div>
            <div className="flex w-full justify-between md:w-64">
              <span className="font-label-md text-white/70">Déductions</span>
              <span className="font-label-md text-error-container">- {formatCurrency(fiche.totalDeductions)}</span>
            </div>
            <div className="flex w-full justify-between border-b border-white/20 pb-sm md:w-64">
              <span className="font-label-md text-white/70">Primes</span>
              <span className="font-label-md text-secondary-fixed-dim">+ {formatCurrency(fiche.totalPrimes)}</span>
            </div>
            {!fiche.estCloture && (
              <p className="pt-xs font-label-sm italic text-white/50">Valeurs provisoires avant clôture</p>
            )}
          </div>
        </div>
      </div>

      {/* Versement */}
      {fiche.estCloture && (
        <div className="mt-lg rounded-xl border border-outline-variant bg-surface-container-high p-lg">
          <div className="flex flex-col items-center justify-between gap-lg md:flex-row">
            <div className="flex items-center gap-lg">
              <div className="rounded-full bg-surface-container-highest p-md">
                <Icon name="payments" className="text-on-surface-variant" />
              </div>
              <div>
                <h4 className="font-title-md text-title-md">Versement de salaire</h4>
                {fiche.montantVerse ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {formatCurrency(fiche.montantVerse)} versés.
                  </p>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Confirmez que le virement a été effectué pour ce collaborateur.
                  </p>
                )}
              </div>
            </div>
            {fiche.montantVerse ? (
              <span className="flex items-center gap-xs rounded-lg bg-secondary-container px-lg py-md font-label-md text-label-md text-on-secondary-container">
                <Icon name="check_circle" filled />
                Versé
              </span>
            ) : (
              <Button
                title={canUpdate ? undefined : 'Permission salaire:update requise'}
                disabled={!canUpdate}
                onClick={() => setVersementOpen(true)}
              >
                Confirmer le versement de {formatCurrency(fiche.salaireNet)}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Fiche de paie */}
      {fiche.estCloture && (
        <div className="mt-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg">
          <h4 className="mb-lg font-title-md text-title-md">Génération de la fiche de paie</h4>
          {fiche.ficheDePaie ? (
            <div className="flex flex-wrap items-center gap-lg">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Générée le {formatDate(fiche.ficheDePaie.dateGeneration)}
              </p>
              <Button variant="outline" onClick={handleDownload} disabled={telechargerMutation.isPending}>
                {telechargerMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  <>
                    <Icon name="picture_as_pdf" />
                    Télécharger le PDF
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-lg">
              <div className="space-y-xs">
                <label className="block font-label-md text-label-md text-on-surface">Date de paiement</label>
                <input
                  type="date"
                  value={jourDePaie}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setJourDePaie(e.target.value)}
                  className="w-64 rounded border border-outline bg-surface-container-lowest p-sm outline-none focus:border-primary"
                />
              </div>
              <Button
                variant="outline"
                title={canUpdate ? undefined : 'Permission salaire:update requise'}
                disabled={!canUpdate || !jourDePaie || genererFicheMutation.isPending}
                onClick={handleGenererFiche}
              >
                {genererFicheMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  <>
                    <Icon name="picture_as_pdf" />
                    Générer le PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <CloturerMoisDialog
        open={cloturerOpen}
        salaireId={fiche.id}
        onClose={() => setCloturerOpen(false)}
        onCloture={() => setCloturerOpen(false)}
      />
      <AjouterPrimeDialog
        open={ajouterPrimeOpen}
        salaireId={fiche.id}
        onClose={() => setAjouterPrimeOpen(false)}
        onAdded={() => setAjouterPrimeOpen(false)}
      />
      <SupprimerPrimeDialog
        salaireId={fiche.id}
        prime={deletingPrime}
        onClose={() => setDeletingPrime(null)}
        onDeleted={() => setDeletingPrime(null)}
      />
      <VersementDialog
        open={versementOpen}
        salaireId={fiche.id}
        salaireNet={fiche.salaireNet}
        onClose={() => setVersementOpen(false)}
        onConfirmed={() => setVersementOpen(false)}
      />
    </>
  );
}
