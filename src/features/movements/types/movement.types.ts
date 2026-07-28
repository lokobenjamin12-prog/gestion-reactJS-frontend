export interface StockOverviewItem {
  stockId: string;
  nomArticle: string;
  categoryNom: string;
  prixUnitaireCategory: number;
  quantite: number;
  // Champ fiable — 'NORMAL' | 'ALERTE' | 'CRITIQUE'. Le sous-objet `alerte`
  // renvoyé par GET /movement-stock/get-stocks est cassé côté backend
  // (buildAlerteStock compare avec 'CRITICAL'/'LOW' en anglais, qui ne
  // matchent jamais l'enum réel TypeSeuil) — on l'ignore volontairement et
  // on se base uniquement sur niveauAlerte.
  niveauAlerte: string;
  valeurStock: number;
}

export type MouvementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'PERTE';

export interface MovementItem {
  id: string;
  type: MouvementType;
  quantite: number;
  avant: number;
  apres: number;
  motif: string;
  date: string;
  isSystem: boolean;
  articleId: string;
  articleNom: string;
  categoryId?: string;
  categoryNom: string;
  auteur: string;
}

export interface MovementsFilters {
  articleStockId?: string;
  page?: number;
  limit?: number;
}

// Forme de pagination unique à ce module — différente de tous les autres
// (totalItems/itemCount/itemsPerPage/totalPages/currentPage, pas de
// hasNextPage/hasPreviousPage : à déduire de currentPage < totalPages).
export interface MovementsPaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedMovementsResponse {
  data: MovementItem[];
  meta: MovementsPaginationMeta;
}

export interface StockAlertItem {
  id: string;
  quantiteActuelle: number;
  niveauAlerte: string;
  nomArticle: string;
  format: string;
  prixUnite: number;
  isUrgent: boolean;
  messageLogistique: string;
}

export interface MovementResult {
  movement: {
    id: string;
    type: MouvementType;
    quantiteSortieOuEntree: number;
    movementDate: string;
  };
  stock: {
    articleId: string;
    nomArticle: string;
    categorie: string;
    prixUnite: number;
    quantiteAvant: number;
    quantiteApres: number;
    niveauAvant: string;
    niveauApres: string;
    niveauChange: boolean;
    valeurStock: number;
  };
  alerte: {
    active: boolean;
    niveau: string;
    message: string;
  };
}
