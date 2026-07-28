import type { StockDetailItem } from '../types/article.types';

export function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

const ALERT_SEVERITY: Record<string, number> = { NORMAL: 0, ALERTE: 1, CRITIQUE: 2 };

// Le niveau d'alerte global d'un article n'est pas renvoyé tel quel par
// GET /articles/find-one/:id — on le dérive du pire niveau parmi ses formats
// réels (detailsStock[].niveauAlerte), plutôt que de l'inventer.
export function getGlobalAlertLevel(details: Pick<StockDetailItem, 'niveauAlerte'>[]): string {
  return details.reduce(
    (worst, d) => ((ALERT_SEVERITY[d.niveauAlerte] ?? 0) > (ALERT_SEVERITY[worst] ?? 0) ? d.niveauAlerte : worst),
    'NORMAL',
  );
}

export function getAlertBadgeClass(niveau: string) {
  switch (niveau) {
    case 'CRITIQUE':
      return 'bg-error-container text-on-error-container';
    case 'ALERTE':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
}
