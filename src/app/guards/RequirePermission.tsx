import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '@/shared/hooks/usePermission';

/**
 * Composant de restriction d'accès basé sur les permissions.
 * @param slug - L'identifiant unique de la permission requise (ex: 'edit:products')
 */
export function RequirePermission({ slug }: { slug: string }) {
  // 1. On appelle le hook personnalisé pour vérifier si l'utilisateur possède cette permission
  const hasPermission = usePermission(slug);

  // 2. Si l'utilisateur n'a pas le droit requis...
  if (!hasPermission) {
    // ...on le redirige vers la page "Accès interdit" (403).
    // "replace" évite qu'il ne reste bloqué dans une boucle infinie s'il fait "Retour"
    return <Navigate to="/forbidden" replace />;
  }

  // 3. Si l'utilisateur a la permission, on affiche le contenu de la route
  return <Outlet />;
}