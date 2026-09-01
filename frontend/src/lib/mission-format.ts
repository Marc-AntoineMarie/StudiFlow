import { StatutMission, TypeMission } from './types';

export const TYPE_LABEL: Record<TypeMission, string> = {
  INTERMITTENCE: 'Intermittence',
  FREELANCE: 'Freelance',
};

export const STATUT_LABEL: Record<StatutMission, string> = {
  PROPOSEE: 'Proposée',
  CONFIRMEE: 'Confirmée',
  TERMINEE: 'Terminée',
};

/** Distinction visible au premier coup d'œil (brief, bloc A) : bleu / or. */
export const TYPE_BADGE_CLASS: Record<TypeMission, string> = {
  INTERMITTENCE: 'bg-accent-blue/15 text-accent-blue-light border-accent-blue/30',
  FREELANCE: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
};
