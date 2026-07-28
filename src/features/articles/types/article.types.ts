export type ArticleStatusFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export interface ArticleListItem {
  id: string;
  nom: string;
  createdAt: string;
  isArchived: boolean;
  // Noms des formats/catégories actifs de cet article (ex: "Sachet", "Carton").
  formats: string[];
  quantiteTotale: number;
  valeurTotale: number;
  // Vrai si au moins un format est en ALERTE ou CRITIQUE — le niveau exact
  // n'est pas renvoyé à ce niveau de granularité (seulement sur la fiche détail).
  enAlerte: boolean;
}

export interface ArticlesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ArticleStatusFilter;
}

export interface ArticlesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedArticlesResponse {
  data: ArticleListItem[];
  meta: ArticlesPaginationMeta;
}

export interface StockDetailItem {
  stockId: string;
  format: string;
  prixUnite: number;
  quantite: number;
  // Niveau réel par format : 'NORMAL' | 'ALERTE' | 'CRITIQUE'.
  niveauAlerte: string;
  valeurEstimee: number;
}

export interface ArticleDetail {
  id: string;
  nom: string;
  createdAt: string;
  isArchived: boolean;
  archivedAt: string | null;
  canMoveStock: boolean;
  detailsStock: StockDetailItem[];
  quantiteTotale: number;
}
