import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AxiosError } from 'axios';
import type { ReactNode } from 'react';
import { toast } from '@/shared/store/toast.store';
import { getApiErrorMessage } from '@/shared/lib/errors';

// Déclare la forme attendue de `meta` sur un `useMutation` pour le typage de
// `mutation.meta` dans les callbacks globaux ci-dessous.
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      successMessage?: string;
      skipToast?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error instanceof AxiosError ? error.response?.status : undefined;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
  // Notification globale succès/échec — chaque `useMutation` peut personnaliser via
  // `meta: { successMessage }` (sinon on retombe sur `data.message` si l'endpoint en
  // renvoie un, puis un libellé générique), ou l'ignorer avec `meta: { skipToast: true }`
  // (utilisé pour les mutations de téléchargement de fichier, qui ont déjà leur propre
  // feedback via le téléchargement du navigateur).
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => {
      if (mutation.meta?.skipToast) return;
      const fallback =
        data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Action effectuée avec succès.';
      toast.success(mutation.meta?.successMessage ?? fallback);
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.skipToast) return;
      toast.error(getApiErrorMessage(error));
    },
  }),
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
