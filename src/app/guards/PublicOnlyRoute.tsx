import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Composant pour les routes exclusivement publiques (Login, Register, etc.).
 * Il redirige les utilisateurs déjà connectés vers le tableau de bord.
 */
export function PublicOnlyRoute() {
  // 1. On récupère le statut d'authentification depuis le store global
  const status = useAuthStore((s) => s.status);

  // 2. Si l'utilisateur est DEJA connecté...
  if (status === 'authenticated') {
    // ...on le redirige directement vers le tableau de bord.
    // "replace" est utilisé pour effacer la page publique de l'historique de navigation.
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Si l'utilisateur n'est pas connecté, on le laisse accéder à la page publique (ex: Login)
  return <Outlet />;
}