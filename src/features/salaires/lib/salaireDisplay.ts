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

export function formatCurrency(amount: string | number) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(amount))} FCFA`;
}

export function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
