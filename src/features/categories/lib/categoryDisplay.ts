export function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
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
