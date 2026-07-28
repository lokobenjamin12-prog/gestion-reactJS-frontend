import type { User } from '../types/user.types';

export function getStatusBadge(user: User) {
  if (user.estArchive) {
    return { label: 'Archivé', dotClass: 'bg-outline', textClass: 'text-on-surface-variant' };
  }
  if (!user.verified) {
    return {
      label: 'En attente de vérification',
      dotClass: 'animate-pulse bg-tertiary-fixed-dim',
      textClass: 'text-tertiary',
    };
  }
  if (!user.active) {
    return { label: 'Désactivé', dotClass: 'bg-error', textClass: 'text-error' };
  }
  return { label: 'Actif', dotClass: 'bg-primary', textClass: 'text-primary' };
}

// Rendu sans composante horaire — ancré en UTC pour éviter qu'une date "pure"
// (dateNaissance, dateRecrutement) recule d'un jour selon le fuseau du navigateur.
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: string | number) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(amount))} FCFA`;
}

export function calculateAge(dateNaissance: string) {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export const HORAIRE_LABELS: Record<User['typeHoraire'], { label: string; icon: string }> = {
  JOUR: { label: 'Jour', icon: 'wb_sunny' },
  NUIT: { label: 'Nuit', icon: 'bedtime' },
  MIXTE: { label: 'Mixte', icon: 'schedule' },
};
