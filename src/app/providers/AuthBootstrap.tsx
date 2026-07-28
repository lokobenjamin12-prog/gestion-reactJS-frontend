import { useEffect, useState, type ReactNode } from 'react';
import { AxiosError } from 'axios';
import { useMeQuery } from '@/features/auth/api/auth.queries';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { FullscreenSpinner } from '@/shared/ui/FullscreenSpinner';
import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui/Button';

/**
 * Composant de démarrage (Bootstrap) pour l'authentification.
 * Il s'assure que l'état de l'utilisateur est récupéré avant d'afficher l'application.
 */

export function AuthBootstrap ({ children }: { children: ReactNode }) {
  // 1. Déclenche automatiquement la requête pour récupérer le profil de l'utilisateur actuel
  const { data, isSuccess, isError, error, refetch, isFetching } = useMeQuery();

  // Actions pour modifier l'état global de l'authentification
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  // Un vrai 401 veut dire "pas authentifié" (token invalide/expiré/absent).
  // Toute autre erreur (backend injoignable, 5xx) est une panne réseau
  // transitoire — la session cookie est probablement toujours valide, on ne
  // doit surtout pas déconnecter l'utilisateur juste parce que le serveur
  // met du temps à démarrer ou répondre.
  const status = error instanceof AxiosError ? error.response?.status : undefined;
  const isAuthError = isError && status === 401;
  const isConnectionError = isError && status !== 401;

  // `ready` ne passe à true qu'une fois que le store a réellement été mis à
  // jour (setUser/clear), jamais juste sur la base de isLoading — sinon il
  // existe un rendu intermédiaire où isLoading est déjà false mais le store
  // est encore à son état 'idle' initial, le temps que le useEffect associé
  // s'exécute. Pendant ce rendu, RouterProvider se monte prématurément avec
  // un status 'idle', ce qui fait rebondir ProtectedRoute vers /auth/login
  // puis PublicOnlyRoute (une fois le store enfin à jour) vers /dashboard —
  // écrasant la page sur laquelle l'utilisateur avait fait un simple refresh.
  // Une fois `ready` passé à true, il ne redevient jamais false, pour ne pas
  // démonter l'app sur un refetch ultérieur de /auth/me en arrière-plan.
  const [ready, setReady] = useState(false);

  // 2. Effet déclenché si la requête réussit : on sauvegarde l'utilisateur dans le store
  useEffect(() => {
    if (isSuccess && data) {
      setUser(data);
      setReady(true);
    }
  }, [isSuccess, data, setUser]);

  // 3. Effet déclenché si la requête échoue : on ne nettoie le store que sur
  // un vrai 401 (session réellement invalide) — pas sur une panne réseau.
  useEffect(() => {
    if (isError) {
      if (isAuthError) {
        clear();
      }
      setReady(true);
    }
  }, [isError, isAuthError, clear]);

  // 4. Tant que le store n'a pas été mis à jour au moins une fois, on bloque l'affichage.
  if (!ready) {
    return <FullscreenSpinner />;
  }

  // 5. Panne réseau/serveur (backend injoignable, 5xx) : on n'affiche ni
  // l'app ni le login — la session est peut-être toujours valide, on
  // propose juste de réessayer une fois le serveur de nouveau joignable.
  if (isConnectionError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-lg bg-surface p-lg text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-error">
          <Icon name="cloud_off" className="text-[32px]" />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Connexion au serveur impossible</h1>
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            Le serveur ne répond pas pour le moment. Vérifie qu'il est bien démarré, puis réessaie.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <>
              <Icon name="refresh" />
              Réessayer
            </>
          )}
        </Button>
      </div>
    );
  }

  // 6. Une fois le statut de l'utilisateur fixé (connecté ou non), on affiche le reste de l'application
  return <>{children}</>;
}
