import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui/Button';

// ============================================================================
// DONNÉES STATIQUES (placeholder)
// ============================================================================
// Ce tableau de bord n'est pas encore branché à une vraie API : les modules
// Commerce et RH n'existent pas encore côté frontend. Les données ci-dessous
// sont donc écrites en dur, juste pour occuper l'espace visuellement, comme
// prévu dans FRONTEND_ARCHITECTURE.md (§6) : "actuellement un placeholder,
// deviendra le vrai tableau de bord au fil des modules".
// Quand le module RH existera, ce tableau sera remplacé par le résultat d'un
// hook TanStack Query (ex: useRhActionsQuery()), sur le même modèle que
// useMeQuery dans features/auth.

/**
 * Liste des "actions RH en attente" affichées dans le widget de droite.
 * `bg`/`fg` sont les classes Tailwind (couleur de fond / couleur de texte)
 * appliquées au petit cercle d'icône de chaque ligne.
 */
const RH_ACTIONS = [
  {
    icon: 'person_add',
    title: '3 nouveaux recrutements',
    subtitle: 'À valider ce jour',
    bg: 'bg-secondary-container',
    fg: 'text-on-secondary-container',
  },
  {
    icon: 'event',
    title: 'Congés annuels',
    subtitle: '12 demandes en attente',
    bg: 'bg-tertiary-fixed',
    fg: 'text-on-tertiary-fixed-variant',
  },
];

/**
 * Lignes du tableau "Transactions récentes".
 * `statusClass` porte les classes de couleur du badge de statut (une combinaison
 * fond/texte différente selon que la transaction est terminée, en cours ou échouée).
 */
const TRANSACTIONS = [
  { id: '#TRA-9021', user: 'Jean-Pierre N.', amount: '45 000 XAF', status: 'Terminé', statusClass: 'bg-surface-container text-on-surface-variant' },
  { id: '#TRA-9022', user: 'Marie-Claire D.', amount: '12 500 XAF', status: 'En cours', statusClass: 'bg-primary-container text-on-primary-container' },
  { id: '#TRA-9023', user: 'Paul Biya III', amount: '125 000 XAF', status: 'Échoué', statusClass: 'bg-error-container text-on-error-container' },
];

// ============================================================================
// COMPOSANT PRINCIPAL : PAGE TABLEAU DE BORD
// ============================================================================
// Ce composant est rendu à l'intérieur de <Outlet /> dans AppLayout.tsx —
// il n'a donc pas besoin de gérer lui-même la sidebar, le header ou le
// conteneur scrollable : tout ça est déjà fourni par le layout parent.
// Ici on ne s'occupe que du contenu propre à la page "/dashboard".
export function DashboardPage() {
  return (
    // Fragment (<>...</>) : on a besoin de plusieurs éléments frères (le fil
    // d'Ariane + le titre, puis la grille), sans vouloir les envelopper dans
    // une div supplémentaire inutile.
    <>
      {/* --------------------------------------------------------------------
          FIL D'ARIANE + TITRE DE PAGE
          -------------------------------------------------------------------- */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
          <span>Ndolecam</span>
          <Icon name="chevron_right" className="text-[14px]" />
          <span className="font-bold text-primary">Tableau de bord</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Aperçu de l'activité</h1>
      </div>

      {/* --------------------------------------------------------------------
          GRILLE "BENTO" — disposition en grille CSS de 12 colonnes.
          Chaque carte ci-dessous occupe un nombre de colonnes différent
          (md:col-span-8, md:col-span-4, md:col-span-12) pour créer la
          disposition asymétrique visible sur la maquette.
          -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        {/* --- Carte 1 : KPI "Performances mensuelles" (8 colonnes sur 12) --- */}
        <div className="relative flex h-80 flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-8">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
              Performances mensuelles
            </span>
            <h3 className="font-headline-lg text-headline-lg mt-sm">+12.4% de croissance</h3>
          </div>
          {/* Boutons volontairement désactivés (disabled) : aucune vraie page
              "rapports" ni export PDF n'existe encore derrière. Un bouton
              cliquable qui ne fait rien serait trompeur. */}
          <div className="flex items-center gap-md">
            <Button disabled>Voir les rapports</Button>
            <Button variant="outline" disabled>
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* --- Carte 2 : widget "Actions RH" (4 colonnes sur 12) --- */}
        <div className="flex h-80 flex-col rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-4">
          <div className="mb-lg flex items-center justify-between">
            <span className="font-title-md text-title-md text-on-surface">Actions RH</span>
            <Icon name="pending_actions" className="text-primary" />
          </div>
          {/* On boucle sur RH_ACTIONS pour générer une ligne par action.
              `key={action.title}` est nécessaire à React pour identifier
              chaque élément de la liste de façon stable. */}
          <div className="flex-1 space-y-md">
            {RH_ACTIONS.map((action) => (
              <div key={action.title} className="flex items-center gap-md rounded-lg p-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.bg} ${action.fg}`}>
                  <Icon name={action.icon} />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md font-medium">{action.title}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{action.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" disabled>
            Accéder au module RH
          </Button>
        </div>

        {/* --- Carte 3 : tableau "Transactions récentes" (12 colonnes = pleine largeur) --- */}
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low md:col-span-12">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-lg py-md">
            <span className="font-title-md text-title-md text-on-surface">Transactions récentes</span>
            <span className="rounded bg-secondary-container px-sm py-1 font-label-sm text-label-sm text-on-secondary-container">
              Commerce Live
            </span>
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest">
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">ID Transaction</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">Utilisateur</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">Montant</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Une ligne <tr> générée par entrée de TRANSACTIONS.
                  `tx.statusClass` change la couleur du badge selon le statut
                  (déjà calculé dans le tableau de données plus haut, pas ici
                  — ça évite un if/else répété dans le JSX). */}
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container">
                  <td className="px-lg py-md font-label-md text-label-md">{tx.id}</td>
                  <td className="px-lg py-md font-body-md text-body-md">{tx.user}</td>
                  <td className="px-lg py-md font-label-md text-label-md font-bold text-primary">{tx.amount}</td>
                  <td className="px-lg py-md">
                    <span
                      className={`rounded-full px-sm py-1 font-label-sm text-label-sm uppercase ${tx.statusClass}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
