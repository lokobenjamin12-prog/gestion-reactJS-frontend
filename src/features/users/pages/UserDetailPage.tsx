import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUserQuery, useUserLogsQuery } from '../api/users.queries';
import { ArchiveUserDialog } from '../components/ArchiveUserDialog';
import { RestoreUserDialog } from '../components/RestoreUserDialog';
import {
  getStatusBadge,
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateAge,
  HORAIRE_LABELS,
} from '../lib/userDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

// ============================================================================
// PETITS HELPERS LOCAUX À CE FICHIER
// ============================================================================

/**
 * Petit composant de mise en page réutilisé pour chaque paire "label / valeur"
 * de la carte "Informations personnelles" (Email, Téléphone, Adresse, ...).
 * Évite de répéter 5 fois la même structure <label>+<div> dans le JSX.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">{label}</label>
      <div className="font-body-md text-body-md text-on-surface">{children}</div>
    </div>
  );
}

// Classes Tailwind du badge de statut dans le tableau "Historique des connexions",
// selon la valeur du champ `state` renvoyé par le backend (enum Prisma State).
const LOG_STATE_STYLES: Record<string, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function UserDetailPage() {
  // useParams lit le segment dynamique de l'URL déclaré dans router.tsx
  // (route "/users/:id") — id est l'identifiant de l'utilisateur affiché.
  const { id } = useParams<{ id: string }>();

  // Vérifie les permissions de L'UTILISATEUR CONNECTÉ (l'admin qui consulte
  // cette page), pas de l'utilisateur affiché — détermine ce qu'on a le droit
  // de faire/voir sur cet écran (archiver quelqu'un, lire son historique).
  const canArchive = usePermission('user:archive');
  const canRestore = usePermission('user:restore');
  const canUpdate = usePermission('user:update');
  const canReadLogs = usePermission('user:read_log');

  // État local d'UI (rien de tout ça n'est persisté ni envoyé au serveur) :
  const [archiving, setArchiving] = useState(false); // le modal de confirmation d'archivage est-il ouvert ?
  const [restoring, setRestoring] = useState(false); // le modal de confirmation de restauration est-il ouvert ?
  const [copied, setCopied] = useState(false); // affiche temporairement une icône "✓" après un clic sur "copier l'email"
  const [logsPage, setLogsPage] = useState(1); // page courante du tableau d'historique (pagination indépendante de la liste des utilisateurs)

  // Deux requêtes réseau séparées et indépendantes : le profil, et l'historique.
  // Le "!" après `id` dit à TypeScript "je te garantis que id n'est pas undefined ici"
  // (vrai en pratique car la route ne matche que si :id est présent dans l'URL).
  const { data: user, isLoading, isError, error } = useUserQuery(id!);
  const { data: logsData, isLoading: logsLoading } = useUserLogsQuery(id!, logsPage);

  // Copie l'email dans le presse-papiers du système et affiche un petit
  // retour visuel (icône qui change) pendant 2 secondes.
  function handleCopyEmail() { 
    if (!user) return;
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);  
  }

  // --- Rendus "early return" : tant que les données ne sont pas là, on
  // n'affiche ni le squelette de la page ni les calculs qui suivent (ils
  // supposent tous que `user` existe). ---
  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !user) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, "Impossible de charger cet utilisateur.")}
      </div>
    );
  }

  // À partir d'ici, TypeScript sait que `user` n'est plus `undefined`
  // (grâce aux deux `return` ci-dessus) — on peut calculer tranquillement
  // les valeurs dérivées utilisées dans le JSX.
  const badge = getStatusBadge(user); // { label, dotClass, textClass } — cf. lib/userDisplay.ts, même logique que la liste
  const horaire = HORAIRE_LABELS[user.typeHoraire]; // JOUR/NUIT/MIXTE → { label, icon }
  const quota = user.quotaCongesAnnuel; // quota annuel total de jours de congés
  const solde = user.soldeConges; // jours de congés encore disponibles
  const pris = Math.max(quota - solde, 0); // jours déjà consommés = quota - solde (jamais négatif)
  const percentPris = quota > 0 ? (pris / quota) * 100 : 0; // remplissage de la barre de progression, en %
  const logs = logsData?.data ?? []; // tableau d'entrées d'historique de la page courante
  const logsMeta = logsData?.meta; // infos de pagination (total, page, lastPage...)

  return (
    <>
      {/* --------------------------------------------------------------------
          FIL D'ARIANE + TITRE + ACTIONS D'EN-TÊTE
          -------------------------------------------------------------------- */}
      <div className="mb-lg flex items-end justify-between">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
            <Link to="/users" className="hover:text-primary">
              Utilisateurs
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-bold text-primary">
              {user.firstName} {user.lastName}
            </span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Détail de l'utilisateur</h2>
        </div>
        <div className="flex gap-md">
          {/* Bascule Archiver/Restaurer selon l'état actuel du compte, chacun
              désactivé si l'admin connecté n'a pas la permission correspondante. */}
          {user.estArchive ? (
            <Button
              variant="outline"
              title={canRestore ? 'Restaurer' : 'Permission user:restore requise'}
              disabled={!canRestore}
              onClick={() => setRestoring(true)}
            >
              <Icon name="unarchive" className="text-[18px]" />
              Restaurer
            </Button>
          ) : (
            <Button
              variant="outline"
              title={canArchive ? 'Archiver' : 'Permission user:archive requise'}
              disabled={!canArchive}
              onClick={() => setArchiving(true)}
            >
              <Icon name="archive" className="text-[18px]" />
              Archiver
            </Button>
          )}
          {canUpdate ? (
            <Link to={`/users/${user.id}/edit`}>
              <Button>
                <Icon name="edit" className="text-[18px]" />
                Modifier
              </Button>
            </Link>
          ) : (
            <Button title="Permission user:update requise" disabled>
              <Icon name="edit" className="text-[18px]" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------
          GRILLE 12 COLONNES : 4 colonnes à gauche (identité), 8 à droite (RH + historique)
          -------------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Colonne gauche : identité & statut */}
        <div className="col-span-12 space-y-lg lg:col-span-4">
          {/* Carte "photo" */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.profilePicture}
              className="mx-auto mb-md h-32 w-32 border-4 border-surface-container-high text-3xl"
            />
            <h3 className="font-title-md text-title-md text-on-surface">
              {user.firstName} {user.lastName}
            </h3>
            <p className="mb-md font-label-md text-label-md text-on-surface-variant">{user.email}</p>
            <div
              className={`inline-flex items-center gap-sm rounded-full border border-outline-variant bg-surface-container-high px-md py-xs font-label-md text-label-md ${badge.textClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
              {badge.label.toUpperCase()}
            </div>
            <div className="mt-lg border-t border-outline-variant pt-lg">
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Inscrit le</p>
              <p className="font-body-md text-body-md font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {/* Carte "Informations personnelles" — utilise le composant <Field> défini plus haut */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="mb-lg flex items-center gap-sm border-b border-outline-variant pb-md">
              <Icon name="person" className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface">Informations personnelles</h3>
            </div>
            <div className="space-y-md">
              <Field label="Email professionnel">
                <span className="flex items-center gap-sm">
                  {user.email}
                  <button type="button" onClick={handleCopyEmail} className="text-primary" title="Copier">
                    {/* L'icône bascule entre "content_copy" et "check" selon l'état `copied» */}
                    <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
                  </button>
                </span>
              </Field>
              <Field label="Téléphone">{user.phoneNumber}</Field>
              {/* Les champs optionnels (whatsapp, adresse, date de naissance) peuvent être `null`
                  en base — on affiche un tiret "—" plutôt que "null" ou une case vide. */}
              <Field label="WhatsApp">{user.whatsappNumber || '—'}</Field>
              <Field label="Adresse">{user.adresse || '—'}</Field>
              <Field label="Date de naissance">
                {user.dateNaissance
                  ? `${formatDate(user.dateNaissance)} (${calculateAge(user.dateNaissance)} ans)`
                  : '—'}
              </Field>
            </div>
          </div>
        </div>

        {/* Colonne droite : RH & historique */}
        <div className="col-span-12 space-y-lg lg:col-span-8">
          {/* Carte "Informations RH" */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <div className="mb-lg flex items-center gap-sm border-b border-outline-variant pb-md">
              <Icon name="badge" className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface">Informations RH</h3>
            </div>
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <div className="rounded-lg border border-outline-variant bg-surface-container p-md">
                <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Rôle / Poste
                </label>
                <p className="mt-xs font-title-md text-title-md text-primary">{user.role?.post ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface-container p-md">
                <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Salaire de base
                </label>
                {/* formatCurrency gère la conversion : salaireBase arrive du backend
                    sous forme de STRING (les Decimal Prisma sont sérialisés en string en JSON),
                    pas un number — voir user.types.ts. */}
                <p className="mt-xs font-title-md text-title-md text-on-surface">
                  {formatCurrency(user.salaireBase)}
                </p>
              </div>
              <div className="rounded-lg border border-outline-variant p-md">
                <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Date de recrutement
                </label>
                <p className="mt-xs font-body-md text-body-md font-medium">{formatDate(user.dateRecrutement)}</p>
              </div>
              <div className="rounded-lg border border-outline-variant p-md">
                <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Type d'horaire
                </label>
                <div className="mt-xs flex items-center gap-sm">
                  <Icon name={horaire.icon} className="text-[18px]" />
                  <span className="font-body-md text-body-md font-bold">{horaire.label.toUpperCase()}</span>
                </div>
              </div>

              {/* Bloc "Solde de congés" — occupe les 2 colonnes de la grille (col-span-2 en md) */}
              <div className="col-span-1 space-y-md md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Solde de congés
                  </label>
                  <span className="font-label-md text-label-md text-primary">
                    {solde} / {quota} jours restants
                  </span>
                </div>
                {/* Barre de progression : largeur en % calculée plus haut (percentPris) via
                    un style inline, car Tailwind ne peut pas générer une classe pour une
                    valeur dynamique arbitraire comme "width: 37%". */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full bg-primary" style={{ width: `${percentPris}%` }} />
                </div>
                <div className="flex gap-lg">
                  <div className="flex items-center gap-sm">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Pris : {pris} jrs</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <div className="h-3 w-3 rounded-full bg-surface-container-high" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Restant : {solde} jrs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des connexions — affiché seulement si l'admin connecté a la
              permission `user:read_log`. Si non, la section entière est absente du
              rendu (pas de tableau vide ni d'erreur 403 visible). */}
          {canReadLogs && (
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
              <div className="flex items-center justify-between border-b border-outline-variant p-lg">
                <div className="flex items-center gap-sm">
                  <Icon name="history" className="text-primary" />
                  <h3 className="font-title-md text-title-md text-on-surface">Historique des connexions</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-outline-variant bg-surface-container">
                    <tr>
                      <th className="px-lg py-md font-label-md text-label-md uppercase text-on-surface-variant">
                        Date & heure
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md uppercase text-on-surface-variant">
                        Action
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md uppercase text-on-surface-variant">
                        Message
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md uppercase text-on-surface-variant">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {/* Trois états possibles du tableau, dans cet ordre de priorité :
                        1) chargement en cours, 2) aucune entrée, 3) la vraie liste. */}
                    {logsLoading ? (
                      <tr>
                        <td className="px-lg py-md text-on-surface-variant" colSpan={4}>
                          Chargement…
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td className="px-lg py-md text-on-surface-variant" colSpan={4}>
                          Aucune activité enregistrée.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="border-b border-outline-variant hover:bg-surface-container">
                          <td className="px-lg py-md font-medium">{formatDateTime(log.createdAt)}</td>
                          <td className="px-lg py-md font-label-md text-label-md text-on-surface-variant">
                            {log.action}
                          </td>
                          <td className="px-lg py-md text-on-surface-variant">{log.message}</td>
                          <td className="px-lg py-md">
                            {/* LOG_STATE_STYLES[log.state] pioche la bonne couleur (vert/rouge)
                                selon que state vaut 'SUCCESS' ou 'FAILED'. */}
                            <span
                              className={`rounded px-sm py-xs font-label-sm text-label-sm uppercase ${LOG_STATE_STYLES[log.state]}`}
                            >
                              {log.state === 'SUCCESS' ? 'Réussi' : 'Échec'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination de l'historique — même pattern Précédent/Suivant que la
                  liste des utilisateurs, mais avec son propre état (`logsPage`),
                  indépendant de la pagination éventuelle d'une autre section de la page. */}
              {logsMeta && logsMeta.total > 0 && (
                <div className="flex items-center justify-between border-t border-outline-variant p-md font-label-md text-label-md">
                  <span className="text-on-surface-variant">Total : {logsMeta.total} entrées</span>
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      disabled={!logsMeta.hasPrevPage}
                      onClick={() => setLogsPage((p) => p - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
                    >
                      <Icon name="chevron_left" className="text-[18px]" />
                    </button>
                    <span className="text-on-surface-variant">
                      Page {logsMeta.page} / {logsMeta.lastPage}
                    </span>
                    <button
                      type="button"
                      disabled={!logsMeta.hasNextPage}
                      onClick={() => setLogsPage((p) => p + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-30"
                    >
                      <Icon name="chevron_right" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------
          ZONE DE DANGER — bouton volontairement désactivé : aucune route
          backend documentée pour "désactiver" un compte indépendamment de
          l'archivage (cf. BACKEND_CONTEXT.md, seuls archive/restore existent).
          -------------------------------------------------------------------- */}
      <div className="mt-xl flex items-center justify-between rounded-xl border border-error-container bg-red-50 p-lg">
        <div>
          <h3 className="flex items-center gap-sm font-title-md text-title-md text-error">
            <Icon name="warning" />
            Zone de danger
          </h3>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            La désactivation de compte n'est pas encore disponible depuis cette interface.
          </p>
        </div>
        <Button variant="danger" title="Bientôt disponible" disabled>
          Désactiver le compte
        </Button>
      </div>

      {/* Modal d'archivage : composant déjà utilisé par UsersListPage.tsx, réutilisé
          tel quel ici. `user={archiving ? user : null}` est le pattern qui contrôle
          son ouverture/fermeture — le composant Modal sous-jacent regarde juste
          si `user` est truthy ou non (voir shared/ui/Modal.tsx). */}
      <ArchiveUserDialog
        user={archiving ? user : null}
        onClose={() => setArchiving(false)}
        onArchived={() => setArchiving(false)}
      />
      <RestoreUserDialog
        user={restoring ? user : null}
        onClose={() => setRestoring(false)}
        onRestored={() => setRestoring(false)}
      />
    </>
  );
}
