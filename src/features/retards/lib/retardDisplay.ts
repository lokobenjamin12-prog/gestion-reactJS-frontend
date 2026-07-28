import type { JourRetard } from '../types/retard.types';

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

export function formatPeriode(mois: number, annee: number) {
  return `${MOIS_LABELS[mois] ?? mois} ${annee}`;
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function countJours(jours: JourRetard[]) {
  const justifies = jours.filter((j) => j.estJustifie).length;
  const injustifies = jours.length - justifies;
  return { justifies, injustifies, total: jours.length };
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
