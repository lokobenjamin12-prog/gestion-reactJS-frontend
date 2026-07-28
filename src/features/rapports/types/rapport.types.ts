export type RapportType = 'ABSENCES' | 'MASSE_SALARIALE' | 'CONTRATS_CDD';

// CSV existe dans l'énumération technique mais le serveur le rejette
// explicitement ("non encore supporté") — jamais proposé dans les formulaires.
export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV';

export interface RapportUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Rapport {
  id: string;
  userId: string | null;
  type: RapportType;
  periode: string;
  mois: number | null;
  annee: number | null;
  formatExport: ExportFormat;
  // Nullifié par le serveur lors de l'archivage (fichier physique supprimé du disque).
  fichier: string | null;
  estArchive: boolean;
  deletedAt: string | null;
  dateGeneration: string;
  user?: RapportUserSummary | null;
}

export interface RapportsFilters {
  type?: RapportType;
  userId?: string;
  mois?: number;
  annee?: number;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

// Forme réelle de GET /rapports : `pagesTotales` seulement — pas de
// hasNextPage/hasPreviousPage (comme le module Absences, mais avec un nom de
// champ différent, aligné sur celui de l'endpoint masse-salariale des Salaires).
export interface RapportsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  pagesTotales: number;
}

export interface PaginatedRapportsResponse<T> {
  data: T[];
  meta: RapportsPaginationMeta;
}

export interface GenerateRapportResult {
  rapport: Rapport;
  fichier: string;
  avertissement: string | null;
}
