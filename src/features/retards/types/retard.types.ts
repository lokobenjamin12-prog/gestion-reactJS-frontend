export interface JourRetard {
  date: string; // ISO YYYY-MM-DD
  estJustifie: boolean;
  heureArrivee?: string | null; // HH:MM
}

export interface RetardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string | null;
}

export interface Retard {
  id: string;
  userId: string;
  mois: number; // 1-12
  annee: number;
  jours: JourRetard[];
  user: RetardUser;
  createdAt: string;
  updatedAt: string;
}

export interface RetardsFilters {
  userId?: string;
  mois?: number;
  annee?: number;
  page?: number;
  limit?: number;
}

// Contrairement à GET /absences, GET /retards renvoie bien hasNextPage/hasPreviousPage.
export interface RetardsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedRetardsResponse<T> {
  data: T[];
  meta: RetardsPaginationMeta;
}
