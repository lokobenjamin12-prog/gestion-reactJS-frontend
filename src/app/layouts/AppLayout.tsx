import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogoutMutation } from '@/features/auth/api/auth.queries';
import { Icon } from '@/shared/ui/Icon';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Avatar } from '@/shared/ui/Avatar';

// ============================================================================
// CONFIGURATION ET DONNÉES STATIQUES
// ============================================================================

interface NavChild {
  label: string;
  icon: string;
  path: string | null;
}

interface NavItem {
  label: string;
  icon: string;
  path: string | null;
  children?: NavChild[];
}

/**
 * Liste des éléments de la barre de navigation latérale.
 * Les éléments avec `path: null` représentent des fonctionnalités futures (désactivées).
 * Un item avec `children` déplie un sous-menu (ex: RH regroupe plusieurs sous-modules).
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', icon: 'dashboard', path: '/dashboard' },
  { label: 'Utilisateurs', icon: 'group', path: '/users' },
  { label: 'Rôles', icon: 'security', path: '/roles' },
  {
    label: 'Commerce',
    icon: 'shopping_cart',
    path: null,
    children: [
      { label: 'Articles', icon: 'inventory_2', path: '/articles' },
      { label: 'Catégories', icon: 'category', path: '/categories' },
      { label: 'Mouvements de stock', icon: 'swap_horiz', path: '/mouvements-stock' },
      { label: 'Sessions commerciales', icon: 'point_of_sale', path: '/sessions' },
    ],
  },
  {
    label: 'RH',
    icon: 'badge',
    path: null,
    children: [
      { label: 'Contrats', icon: 'description', path: '/contrats' },
      { label: 'Absences', icon: 'event_busy', path: '/absences' },
      { label: 'Retards', icon: 'schedule', path: '/retards' },
      { label: 'Salaires', icon: 'payments', path: '/salaires' },
      { label: 'Départements', icon: 'apartment', path: '/departments' },
      { label: 'Rapports', icon: 'analytics', path: '/rapports' },
    ],
  },
  { label: 'Logs', icon: 'history_edu', path: '/logs' },
];

/**
 * Dictionnaire associant les routes de l'application à leur titre correspondant.
 * Utilisé pour mettre à jour dynamiquement le titre dans le Header.
 */
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/account': 'Mon compte',
  '/users': 'Utilisateurs',
  '/roles': 'Rôles',
  '/contrats': 'Contrats & Alertes RH',
  '/absences': 'Absences',
  '/retards': 'Retards',
  '/salaires': 'Salaires',
  '/departments': 'Départements',
  '/articles': 'Articles',
  '/categories': 'Catégories',
  '/mouvements-stock': 'Mouvements de stock',
  '/sessions': 'Sessions commerciales',
  '/rapports': 'Rapports RH',
  '/logs': 'Logs',
};

// Largeur du sidebar : ajustable par l'utilisateur via la poignée de
// redimensionnement, bornée entre ces deux valeurs et mémorisée localement.
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 280;
const SIDEBAR_STORAGE_KEY = 'ndolecam:sidebarWidth';

function getInitialSidebarWidth() {
  const stored = Number(localStorage.getItem(SIDEBAR_STORAGE_KEY));
  return stored >= SIDEBAR_MIN_WIDTH && stored <= SIDEBAR_MAX_WIDTH ? stored : SIDEBAR_DEFAULT_WIDTH;
}

// ============================================================================
// COMPOSANT PRINCIPAL : LAYOUT DE L'APPLICATION
// ============================================================================
export function AppLayout() {
  // --- Hooks de gestion d'état et de requêtes ---
  const user = useAuthStore((s) => s.user); // Récupération des infos de l'utilisateur connecté
  const logoutMutation = useLogoutMutation(); // Hook de gestion de la déconnexion (mutation asynchrone)
  
  // --- Hooks de navigation ---
  const location = useLocation(); // Récupération de l'URL actuelle
  const pageTitle = PAGE_TITLES[location.pathname] ?? ''; // Détermination du titre de la page courante
  const [openMenu, setOpenMenu] = useState<string | null>(null); // Label du sous-menu actuellement déplié
  const [confirmingLogout, setConfirmingLogout] = useState(false); // Affiche la modale de confirmation de déconnexion

  // --- Redimensionnement du sidebar par glisser-déposer ---
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const isResizing = useRef(false);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing.current) return;
      setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX)));
    }
    function handleMouseUp() {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarWidth((width) => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
        return width;
      });
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  function startSidebarResize() {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }


  return (
    // Conteneur principal plein écran 
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      
      {/* ----------------------------------------------------------------------
          1. SIDEBAR (Barre latérale gauche)
          ---------------------------------------------------------------------- */}
      <aside
        style={{ width: sidebarWidth }}
        className="fixed left-0 top-0 z-40 flex h-full flex-col space-y-sm border-r border-outline-variant bg-surface-container-low p-md"
      >
        {/* Logo et Identité de la marque */}
        <div className="mb-md flex items-center gap-sm px-md py-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Icon name="corporate_fare" filled className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg font-bold leading-none text-primary">Ndolecam</span>
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Back-office
            </span>
          </div>
        </div>

        {/* Menu de Navigation principal */}
        <nav className="flex-1 space-y-sm overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            // Cas 3 : L'item déplie un sous-menu (ex: RH regroupe plusieurs sous-modules)
            if (item.children) {
              const hasActiveChild = item.children.some(
                (child) => child.path && location.pathname.startsWith(child.path),
              );
              const isOpen = openMenu === item.label || hasActiveChild;

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setOpenMenu((current) => (current === item.label ? null : item.label))}
                    className={`flex w-full items-center gap-md rounded-lg px-md py-sm transition-colors ${
                      hasActiveChild
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span className="flex-1 text-left font-body-md text-body-md">{item.label}</span>
                    <Icon name={isOpen ? 'expand_less' : 'expand_more'} className="text-[18px]" />
                  </button>
                  {isOpen && (
                    <div className="mt-xs space-y-xs pl-xl">
                      {item.children.map((child) =>
                        child.path ? (
                          <NavLink
                            key={child.label}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center gap-sm rounded-lg px-md py-xs transition-colors ${
                                isActive
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'text-on-surface-variant hover:bg-surface-container'
                              }`
                            }
                          >
                            <Icon name={child.icon} className="text-[18px]" />
                            <span className="font-body-sm text-body-sm">{child.label}</span>
                          </NavLink>
                        ) : (
                          <div
                            key={child.label}
                            title="Module à venir"
                            className="flex cursor-not-allowed items-center gap-sm rounded-lg px-md py-xs text-on-surface-variant/40"
                          >
                            <Icon name={child.icon} className="text-[18px]" />
                            <span className="font-body-sm text-body-sm">{child.label}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Cas 1 : Le module est disponible (le chemin existe)
            if (item.path) {
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-md rounded-lg px-md py-sm transition-colors ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container' // Style si l'onglet est actif
                        : 'text-on-surface-variant hover:bg-surface-container' // Style par défaut / survol
                    }`
                  }
                >
                  <Icon name={item.icon} />
                  <span className="font-body-md text-body-md">{item.label}</span>
                </NavLink>
              );
            }

            // Cas 2 : Le module n'est pas encore disponible (path est null)
            return (
              <div
                key={item.label}
                title="Module à venir"
                className="flex cursor-not-allowed items-center gap-md rounded-lg px-md py-sm text-on-surface-variant/40"
              >
                <Icon name={item.icon} />
                <span className="font-body-md text-body-md">{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Section Bas de Sidebar : Support Technique */}
        <div className="border-t border-outline-variant pt-md">
          <div className="flex items-center gap-sm rounded-lg bg-surface-container p-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="support_agent" className="text-[18px]" />
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant">Support technique</span>
          </div>
        </div>

        {/* Poignée de redimensionnement */}
        <div
          onMouseDown={startSidebarResize}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary/60"
        />
      </aside>

      {/* ----------------------------------------------------------------------
          2. BLOC DE DROITE (Header + Zone de contenu)
          ---------------------------------------------------------------------- */}
      <div style={{ marginLeft: sidebarWidth }} className="flex h-full flex-1 flex-col overflow-hidden">
        {/* En-tête (Header supérieur) */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-lg">
          {/* Titre dynamique de la page courante */}
          <h2 className="font-title-md text-title-md text-on-surface">{pageTitle}</h2>

          {/* Actions globales et Profil utilisateur */}
          <div className="flex items-center gap-lg">
            {/* Boutons d'actions secondaires */}
            <div className="flex items-center gap-sm">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <Icon name="notifications" />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <Icon name="settings" />
              </button>
            </div>

            {/* Séparateur visuel vertical */}
            <div className="h-8 w-px bg-outline-variant" />

            {/* Bloc Profil, Avatar et Déconnexion */}
            <div className="flex items-center gap-md">
              <NavLink
                to="/account"
                className="flex items-center gap-md rounded-lg p-xs transition-colors hover:bg-surface-container"
              >
                {/* Identité de l'utilisateur */}
                <div className="flex flex-col text-right">
                  <span className="font-label-md text-label-md font-bold leading-tight text-on-surface">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{user?.email}</span>
                </div>
                {/* Avatar : photo réelle si présente, initiales sinon */}
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  src={user?.profilePicture}
                  className="h-10 w-10 border border-outline-variant text-label-md"
                />
              </NavLink>
              {/* Bouton de Déconnexion sécurisé */}
              <button
                type="button"
                onClick={() => setConfirmingLogout(true)} // Ouvre la confirmation avant de déconnecter
                disabled={logoutMutation.isPending} // Désactive le bouton pendant la requête réseau
                aria-label="Déconnexion"
                className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-50"
              >
                <Icon name="logout" />
              </button>
            </div>
          </div>
        </header>

          {/* ----------------------------------------------------------------------
            3. ZONE DE CONTENU DYNAMIQUE (Main)
            ---------------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto bg-surface p-lg">
          <div className="mx-auto max-w-7xl space-y-lg">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modale de confirmation avant déconnexion */}
      <Modal open={confirmingLogout} onClose={() => setConfirmingLogout(false)}>
        <div className="flex items-start gap-md p-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
            <Icon name="logout" className="text-[28px]" />
          </div>
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">Se déconnecter ?</h3>
            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
              Vous devrez vous reconnecter pour accéder de nouveau au back-office.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-md border-t border-outline-variant bg-surface-container-low p-lg sm:flex-row">
          <Button variant="outline" onClick={() => setConfirmingLogout(false)} disabled={logoutMutation.isPending}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="logout" className="text-sm" />
                Se déconnecter
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
