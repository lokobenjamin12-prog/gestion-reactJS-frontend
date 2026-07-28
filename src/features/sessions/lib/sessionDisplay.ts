export function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-secondary-container text-on-secondary-container';
    case 'CLOSED':
      return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED':
      return 'bg-error-container text-on-error-container';
    default:
      return 'bg-surface-container-highest text-on-surface-variant';
  }
}

// jourOuverture est une chaîne "pure" YYYY-MM-DD (pas un timestamp) — on la
// reformate directement sans passer par Date() pour éviter tout décalage de
// fuseau horaire.
export function formatJourOuverture(jourOuverture: string) {
  const [year, month, day] = jourOuverture.split('-');
  return `${day}/${month}/${year}`;
}

// heureDepart/heureRetour sont de vrais horodatages — affichage en heure locale.
export function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatUserName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`;
}

export function formatArticle(article: { nom: string; categorie: string }) {
  return `${article.nom} — ${article.categorie}`;
}
