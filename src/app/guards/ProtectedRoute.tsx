import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Composant de protection des routes.
 * Il enveloppe les routes privées pour s'assurer que l'utilisateur est connecté.
 */
export function ProtectedRoute() {
  // 1. On récupère le statut d'authentification actuel depuis le store global (Zustand/Redux, etc.)
  const status = useAuthStore((s) => s.status);
  
  // 2. On récupère l'objet "location" qui contient l'URL actuelle à laquelle l'utilisateur tente d'accéder
  const location = useLocation();

  // 3. Si l'utilisateur n'est PAS authentifié...
  if (status !== 'authenticated') {
    // ...on le redirige vers la page de login.
    // - "replace": remplace l'URL actuelle dans l'historique pour éviter que le bouton "Retour" du navigateur ne bug.
    // - "state": sauvegarde l'URL d'origine (from) pour pouvoir y retourner après une connexion réussie.
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // 4. Si l'utilisateur est authentifié, on affiche les composants enfants (les routes protégées)
  return <Outlet />;
}