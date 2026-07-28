export interface Prime {
  somme: number;
  raison: string;
}

export interface SalaireUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: { post: string };
  profilePicture?: string | null;
}

export interface FicheDePaieSummary {
  id: string;
  dateGeneration: string;
}

export interface Salaire {
  id: string;
  userId: string;
  mois: number;
  annee: number;

  nbJoursOuvrables: number;
  prixJournalier: string; // Prisma Decimal → string
  salaireBrut: string;

  nbAbsJust: number;
  nbAbsInjust: number;
  deductionAbs: string;

  nbRetardsJust: number;
  nbRetardsInjust: number;
  deductionRetards: string;

  totalDeductions: string;

  primes: Prime[];
  totalPrimes: string;

  salaireNet: string;
  montantVerse: string | null;
  ecart: string | null;

  estCloture: boolean;
  dateCloture: string | null;

  user: SalaireUser;
  ficheDePaie: FicheDePaieSummary | null;
  // Rattachées uniquement à la clôture (salaireId posé sur l'Absence/le Retard existant) —
  // présentes ⇒ des fiches Absences/Retards existent pour ce collaborateur/mois.
  absence?: { id: string } | null;
  retard?: { id: string } | null;

  createdAt: string;
  updatedAt: string;
}

export interface SalairesFilters {
  userId?: string;
  mois?: number;
  annee?: number;
  estCloture?: boolean;
  page?: number;
  limit?: number;
}

export interface SalairesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedSalairesResponse<T> {
  data: T[];
  meta: SalairesPaginationMeta;
}

// GET /salaires/masse-salariale — agrégats déjà convertis en number côté backend
// (Number(...) appliqué aux sommes Prisma), contrairement aux lignes de `data`
// ci-dessous qui restent des Decimal sérialisés en string, comme partout ailleurs.
export interface MasseSalarialeAgregats {
  totalBrut: number;
  totalDeductions: number;
  totalPrimes: number;
  totalNet: number;
  totalVerse: number;
  ecartTotal: number;
}

export interface MasseSalarialeEntry {
  id: string;
  salaireBrut: string;
  totalDeductions: string;
  totalPrimes: string;
  salaireNet: string;
  montantVerse: string | null;
  mois: number;
  annee: number;
  estCloture: boolean;
  user: SalaireUser;
}

// Nom de champ différent des autres endpoints paginés du module (`pagesTotales`,
// pas `totalPages`) — particularité réelle de GET /salaires/masse-salariale.
export interface MasseSalarialeMeta {
  total: number;
  page: number;
  limit: number;
  pagesTotales: number;
}

export interface MasseSalarialeResponse {
  periode: string;
  agregatsGlobaux: MasseSalarialeAgregats;
  data: MasseSalarialeEntry[];
  meta: MasseSalarialeMeta;
}

export interface MasseSalarialeFilters {
  mois: number;
  annee: number;
  page?: number;
  limit?: number;
}

// GET /salaires/user/:userId/historique-paiements — uniquement les salaires
// clôturés ET déjà versés (montantVerse non nul). Ici le service applique
// explicitement Number(...) sur les Decimal, donc ce sont de vrais number,
// contrairement à Salaire/MasseSalarialeEntry qui restent des string.
export interface HistoriqueFicheDePaie {
  id: string;
  dateGeneration: string;
  signeeParUser: boolean;
  dateSignature: string | null;
  jourDePaie: string;
}

export interface HistoriquePaiementEntry {
  id: string;
  periode: string;
  mois: number;
  annee: number;
  salaireBrut: number;
  totalDeductions: number;
  totalPrimes: number;
  salaireNet: number;
  montantVerse: number;
  ecart: number;
  aEcart: boolean;
  dateCloture: string;
  ficheDePaie: HistoriqueFicheDePaie | null;
}

export interface HistoriquePaiementsQueryFilters {
  page?: number;
  limit?: number;
  annee?: number;
  mois?: number;
  montantMinimum?: number;
  montantMaximum?: number;
  avecEcart?: boolean;
  avecFiche?: boolean;
  ficheSigne?: boolean;
  dateClotureDebut?: string;
  dateClotureFin?: string;
}

export interface HistoriquePaiementsResponse {
  employe: SalaireUser;
  agregats: {
    totalPaiements: number;
    totalVerse: number;
    totalNet: number;
    totalDeductions: number;
    totalPrimes: number;
  };
  data: HistoriquePaiementEntry[];
  meta: SalairesPaginationMeta;
}
