import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from './auth.api';
import { useAuthStore } from '../store/auth.store';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    // Un 401 signifie vraiment "non authentifié" — inutile de réessayer.
    // Toute autre erreur (backend injoignable au démarrage, 5xx passager)
    // est probablement transitoire : on retente avant de conclure quoi que
    // ce soit sur l'état de la session.
    retry: (failureCount, error) => {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
    meta: { successMessage: 'Connexion réussie.' },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      queryClient.clear();
    },
    meta: { successMessage: 'Déconnexion réussie.' },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    meta: { successMessage: 'Email de réinitialisation envoyé avec succès.' },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
    meta: { successMessage: 'Mot de passe réinitialisé avec succès.' },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.verifyEmail,
    // La réponse de verify-email ne contient qu'un sous-ensemble de l'utilisateur
    // (id/email/firstName) — on va chercher le profil complet nous-mêmes plutôt
    // que de passer par invalidateQueries(), qui ne fait que déclencher un refetch
    // en arrière-plan et laisse AuthBootstrap mettre à jour le store de façon
    // indirecte et asynchrone. On préfère ici le pattern direct déjà utilisé par
    // useLoginMutation (setUser + setQueryData), plus simple et immédiat.
    onSuccess: async () => {
      const user = await authApi.me();
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
    meta: { successMessage: 'Adresse email vérifiée avec succès.' },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
    meta: { successMessage: 'Profil mis à jour avec succès.' },
  });
}

export function useUploadMyProfilePictureMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.uploadMyProfilePicture,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
    meta: { successMessage: 'Photo de profil mise à jour avec succès.' },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: authApi.changePassword,
    // Le backend invalide la session (accessToken/refreshToken) après un
    // changement de mot de passe — la déconnexion locale est gérée par
    // l'appelant (AccountPage), pas ici, car elle doit suivre l'affichage
    // du message de succès plutôt que le précéder.
    meta: { successMessage: 'Mot de passe changé avec succès. Veuillez vous reconnecter.' },
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    meta: { successMessage: 'Email de vérification renvoyé avec succès.' },
  });
}
