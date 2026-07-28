export type ContratType = 'CDI' | 'CDD';

export interface ContratUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string | null;
}

// Historique en lecture seule des alertes générées automatiquement par le cron
// backend à 30/15/7 jours avant l'échéance d'un CDD — jamais créées manuellement.
export interface AlerteCDD {
  id: string;
  delaiJours: number;
  estEnvoyee: boolean;
  envoyeeAt: string | null;
}

export interface Contrat {
  id: string;
  userId: string;
  type: ContratType;
  dateDebut: string;
  dateFin: string | null;
  deletedAt: string | null;
  createdAt: string;
  user: ContratUser;
  alertes: AlerteCDD[];
}

export interface ContratsFilters {
  userId?: string;
  type?: ContratType;
  dateDebutFrom?: string;
  dateDebutTo?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface ContratsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedContratsResponse<T> {
  data: T[];
  meta: ContratsPaginationMeta;
}
