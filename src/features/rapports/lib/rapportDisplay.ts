import type { ExportFormat, RapportType } from '../types/rapport.types';

export const MOIS_LABELS = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// Année min/max acceptée par CreateRapportDto (2026-2030) — distincte de la
// fenêtre 2020-2026 acceptée par FilterRapportDto pour l'historique.
export const RAPPORT_ANNEE_MIN = 2026;
export const RAPPORT_ANNEE_MAX = 2030;

// Fenêtre acceptée par FilterRapportDto pour filtrer l'historique — différente
// de celle de la génération (2026-2030) : ici 2020-2026, car l'historique peut
// remonter à des rapports générés dans le passé.
export const RAPPORT_FILTER_ANNEE_MIN = 2020;
export const RAPPORT_FILTER_ANNEE_MAX = 2026;

export const RAPPORT_TYPE_LABELS: Record<RapportType, string> = {
  ABSENCES: 'Absences & Retards',
  MASSE_SALARIALE: 'Masse salariale',
  CONTRATS_CDD: 'Contrats CDD',
};

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  PDF: 'PDF (.pdf)',
  EXCEL: 'Excel (.xlsx)',
  CSV: 'CSV (.csv)',
};

export function formatPeriode(mois: number | null, annee: number | null) {
  if (mois && annee) return `${MOIS_LABELS[mois] ?? mois} ${annee}`;
  if (annee) return String(annee);
  return 'Toutes périodes';
}
