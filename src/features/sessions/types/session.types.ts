export type SessionStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface DepenseItem {
  montant: number;
  motif: string;
}

// Correspond exactement à SessionSummaryDto (backend) — utilisé pour la liste ET le détail.
export interface SessionSummary {
  id: string;
  commercial: { id: string; firstName: string; lastName: string; profilePicture?: string | null };
  manager: { id: string; firstName: string; lastName: string; profilePicture?: string | null };
  article: { nom: string; categorie: string; prixUnite: number };
  quantiteDepart: number;
  quantiteRetour: number | null;
  quantiteVendue: number | null;
  jourOuverture: string; // YYYY-MM-DD
  heureDepart: string;
  heureRetour: string | null;
  totalVentesRecues: number | null;
  totalDepenses: number;
  depenses: DepenseItem[];
  chiffreAffaireTheorique: number | null;
  ecartCaisse: number | null;
  status: SessionStatus;
}

export interface Session {
  id : string;
  commercial: { id : string};
  manager: { nom: string}
}


export interface SessionsFilters {
  status?: SessionStatus;
  jourOuverture?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface SessionsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedSessionsResponse {
  data: SessionSummary[];
  meta: SessionsPaginationMeta;
}
