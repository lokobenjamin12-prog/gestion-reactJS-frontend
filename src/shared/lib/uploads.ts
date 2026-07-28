import { API_BASE_URL } from './axios';

// Le serveur de fichiers statiques (/uploads/...) est servi hors du préfixe
// /api/v1 (voir app.useStaticAssets dans main.ts côté backend) — on retire
// donc ce suffixe de l'URL de base de l'API pour reconstruire l'origine.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

export function getUploadUrl(relativePath?: string | null) {
  if (!relativePath) return null;
  return `${API_ORIGIN}/uploads/${relativePath}`;
}
