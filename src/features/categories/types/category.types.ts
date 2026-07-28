export interface CategoryListItem {
  id: string;
  nomUnique: string;
  prixUnite: number;
  description: string | null;
  article: { id: string; nom: string };
  quantiteDisponible: number;
  // Vraie valeur renvoyée par le serveur : 'NORMAL' | 'ALERTE' | 'CRITIQUE'.
  alerte: string;
}

export interface CategoriesFilters {
  articleId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CategoriesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedCategoriesResponse {
  data: CategoryListItem[];
  meta: CategoriesPaginationMeta;
}

export interface CategoryStockInfo {
  id: string;
  quantiteActuelle: number;
  niveauAlerte: string;
}

export interface CategoryDetail {
  id: string;
  nomFormat: string;
  description: string | null;
  prixUnite: number;
  // Seul le nom de l'article parent est renvoyé ici (pas son id) — contrairement
  // à CategoryItemDto (liste) qui inclut { id, nom }. Impossible de faire un
  // lien cliquable vers la fiche article depuis cet écran.
  article: { nom: string };
  stock: CategoryStockInfo | null;
}
