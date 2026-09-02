import { TagProjet } from './types';

export const TAG_LABEL: Record<TagProjet, string> = {
  PRO: 'Pro',
  PERSO: 'Perso',
};

export const TAG_BADGE_CLASS: Record<TagProjet, string> = {
  PRO: 'bg-accent-blue/15 text-accent-blue-light border-accent-blue/30',
  PERSO: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
};

export function formatDateProjet(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}
