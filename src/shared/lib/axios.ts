import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';

// 1. Récupération de l'URL du serveur depuis les variables d'environnement
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 2. Création de l'instance configurée
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial : permet d'envoyer automatiquement les cookies de session (HttpOnly) à chaque requête
});

// Interface décrivant le format de réponse standard du Backend
interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Fonction de vérification (Type Guard) pour savoir si la réponse utilise l'enveloppe
function isEnvelope(payload: unknown): payload is ApiSuccessEnvelope<unknown> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  );
}

/**
 * INTERCEPTOR 1 : Nettoyage de la réponse
 * Déballe systématiquement { success, data, timestamp } -> pour ne garder que data
 */
api.interceptors.response.use((response) => {
  if (isEnvelope(response.data)) {
    response.data = response.data.data; // On remplace le contenu par la propriété .data interne
  }
  return response;
});

// Type étendu pour ajouter un drapeau "_retry" afin d'éviter les boucles infinies de requêtes
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Routes sur lesquelles il ne faut SOURTOUT PAS tenter un rafraîchissement en cas de 401
const NO_REFRESH_RETRY_PATHS = ['/auth/login', '/auth/refresh'];

// Variables de gestion de la file d'attente (Queue)
let isRefreshing = false; // Indique si une demande de nouveau token est déjà en cours
let pendingQueue: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

// Fonction pour libérer toutes les requêtes en attente une fois le token obtenu (ou en cas d'échec)
function flushQueue(error: unknown) {
  for (const { resolve, reject } of pendingQueue) {
    if (error) reject(error);
    else resolve();
  }
  pendingQueue = [];
}

/**
 * INTERCEPTOR 2 : Gestion des erreurs 401 (Refresh Token)
 */
api.interceptors.response.use(
  (response) => response, // Si tout va bien, on ne fait rien
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = NO_REFRESH_RETRY_PATHS.some((path) => requestUrl.includes(path));

    // Si l'erreur n'est pas un 401, ou si la requête a déjà été tentée deux fois, ou si c'est une page d'auth: on rejette l'erreur
    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // CAS 1 : Un rafraîchissement est DÉJÀ en cours pour une autre requête.
    // On met cette requête en attente (Promise) dans la file d'attente.
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => api(originalRequest)); // Une fois libérée, on rejoue la requête
    }

    // CAS 2 : C'est la première requête qui constate le 401. C'est elle qui va piloter le rafraîchissement.
    originalRequest._retry = true; // On marque la requête pour ne pas repasser ici
    isRefreshing = true;

    try {
      // On demande poliment un nouveau token au serveur (en utilisant l'instance axios globale pour éviter l'interceptor)
      await axios.post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true });
      
      // Si ça réussit, on libère toutes les AUTRES requêtes qui s'étaient mises en attente entre temps
      flushQueue(null);
      
      // Et on rejoue la requête initiale qui avait échoué
      return api(originalRequest);
    } catch (refreshError) {
      // Si le rafraîchissement échoue (ex: la session a expiré sur le serveur)
      flushQueue(refreshError);
      useAuthStore.getState().clear(); // On vide le store de l'application (ce qui va rediriger vers le Login)
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
