export interface JourAbsence {
  date: string; // ISO YYYY-MM-DD
  estJustifie: boolean;
}

export interface AbsenceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string | null;
}

export interface Absence {
  id: string;
  userId: string;
  mois: number; // 1-12
  annee: number;
  jours: JourAbsence[];
  user: AbsenceUser;
  createdAt: string;
  updatedAt: string;
}


export interface AbsencesFilters {
  userId?: string;
  mois?: number;
  annee?: number;
  page?: number;
  limit?: number;
}

// Forme réellement renvoyée par GET /absences — différente de Users/Roles/Contrats :
// pas de hasNextPage/hasPreviousPage, juste totalPages (à dériver côté front si besoin).
export interface AbsencesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAbsencesResponse<T> {
  data: T[];
  meta: AbsencesPaginationMeta;
}
