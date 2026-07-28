import type { Contrat } from '../types/contrat.types';

// dateDebut/dateFin sont des dates "pures" (sans heure significative), stockées en
// base à minuit UTC. Les formater sans préciser timeZone applique le fuseau du
// navigateur et peut faire reculer la date d'un jour pour tout fuseau en retard sur
// UTC (ex: DB = 2026-07-18T00:00:00Z, affiché 2026-07-17 dans un fuseau UTC-négatif).
export function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

// Même seuil par défaut que GET /contrats/expirations côté backend (delaiJours = 30
// si le paramètre `delai` est omis) — sert uniquement à l'affichage du badge de statut,
// le calcul réel d'échéance reste fait par le backend.
const DEFAULT_ALERT_THRESHOLD_DAYS = 30;

export function getContratStatusBadge(contrat: Contrat) {
  if (contrat.deletedAt) {
    return {
      label: 'Archivé',
      className: 'bg-surface-container text-on-surface-variant',
      dotClassName: 'bg-outline',
    };
  }
  if (contrat.type === 'CDD' && contrat.dateFin) {
    const joursRestants = Math.ceil((new Date(contrat.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (joursRestants <= DEFAULT_ALERT_THRESHOLD_DAYS) {
      return {
        label: 'Expire bientôt',
        className: 'bg-error-container text-on-error-container',
        dotClassName: 'bg-error',
      };
    }
  }
  return {
    label: 'Actif',
    className: 'bg-surface-container-highest text-on-surface-variant',
    dotClassName: 'bg-outline',
  };
}

export function getDaysRemaining(dateFin: string) {
  return Math.ceil((new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Mêmes paliers que le cron backend traiterAlertesCDD() (délais 30/15/7 jours),
// pas des seuils inventés côté front.
export function getUrgencyBadge(joursRestants: number) {
  if (joursRestants < 7) {
    return {
      label: 'Critique',
      borderClassName: 'border-error',
      valueClassName: 'text-error',
      badgeClassName: 'bg-error-container text-on-error-container',
    };
  }
  if (joursRestants < 15) {
    return {
      label: 'Urgent',
      borderClassName: 'border-on-tertiary-container',
      valueClassName: 'text-on-tertiary-container',
      badgeClassName: 'bg-tertiary-fixed text-on-tertiary-fixed',
    };
  }
  return {
    label: 'À surveiller',
    borderClassName: 'border-on-secondary-container',
    valueClassName: 'text-on-secondary-container',
    badgeClassName: 'bg-secondary-container text-on-secondary-container',
  };
}

export function getTypeBadgeClass(type: Contrat['type']) {
  return type === 'CDI'
    ? 'bg-primary-container text-on-primary-container'
    : 'bg-tertiary-container text-on-tertiary-container';
}
