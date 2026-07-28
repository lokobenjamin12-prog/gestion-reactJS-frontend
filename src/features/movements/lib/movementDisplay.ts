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

export function getMovementTypeBadgeClass(type: string) {
  switch (type) {
    case 'ENTREE':
      return 'bg-emerald-100 text-emerald-800';
    case 'SORTIE':
      return 'bg-secondary-container text-on-secondary-container';
    case 'PERTE':
      return 'bg-error-container text-on-error-container';
    case 'AJUSTEMENT':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-surface-container-highest text-on-surface-variant';
  }
}

// movementDate est un vrai horodatage (pas une date "pure") — heure locale
// du navigateur, contrairement aux dates de contrat/absence formatées en UTC.
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
