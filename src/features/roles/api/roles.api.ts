import { api } from '@/shared/lib/axios';
import type { PaginatedRolesResponse, RoleWithRelations } from '../types/role.types';
import type { CreateRolePayload, UpdateRolePayload } from '../schemas/role.schemas';

// ============================================================================
// TYPAGE DES ENTRÉES / SORTIES (CONTRATS DE DONNÉES)
// ============================================================================

/**
 * Critères de filtrage et paramètres de pagination acceptés
 * par l'API lors de la récupération de la liste des rôles.
 */
export interface RolesFilters {
  search?: string;        // Recherche textuelle (ex: par nom de rôle)
  departmentId?: number;  // Filtrage par identifiant de département
  permissionId?: number;  // Filtrage par une permission précise possédée par le rôle
  page?: number;          // Numéro de la page demandée (pour la pagination)
  limit?: number;         // Nombre d'éléments maximum à retourner par page
}

// ============================================================================
// REQUÊTES API (SERVICES HYDRO-RÉSEAU OU AXIOS)
// ============================================================================

/**
 * Service gérant l'ensemble des requêtes HTTP relatives aux Rôles.
 */
export const rolesApi = {
  /**
   * Récupère la liste paginée et filtrée des rôles depuis le serveur.
   * Chaque rôle inclut déjà son département, ses permissions et les
   * utilisateurs qui le portent (cf. defaultInclude() côté backend) — pas
   * besoin d'appels supplémentaires pour afficher les compteurs.
   * * @param params - Options de filtrage, de tri ou de pagination facultatives.
   * @returns Une promesse contenant la réponse paginée enveloppant les objets `RoleWithRelations`.
   */
  
  list: (params?: RolesFilters) =>
    api
      // Effectue une requête HTTP GET sur le endpoint '/roles' en transmettant les filtres
      .get<PaginatedRolesResponse<RoleWithRelations>>('/roles', { params })
      // Déballe la réponse d'Axios pour ne retourner que les données utiles (`data`)
      .then((res) => res.data),

  get: (id: number) => api.get<RoleWithRelations>(`/roles/${id}`).then((res) => res.data),

  create: (payload: CreateRolePayload) =>
    api.post<RoleWithRelations>('/roles', payload).then((res) => res.data),

  update: (id: number, payload: UpdateRolePayload) =>
    api.patch<RoleWithRelations>(`/roles/${id}`, payload).then((res) => res.data),

  // DELETE /roles/:id répond 409 si des utilisateurs sont encore rattachés à
  // ce rôle — le message d'erreur réel est affiché tel quel côté frontend,
  // pas de logique spéciale à coder ici pour ce cas.
  remove: (id: number) => api.delete<{ message: string }>(`/roles/${id}`).then((res) => res.data),
};
