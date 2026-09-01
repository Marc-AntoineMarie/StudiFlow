import { ReactNode } from 'react';

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Bouton de filtre/toggle en pilule — type, statut, formulaire mission. */
export function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent-blue bg-accent-blue/15 text-accent-blue-light'
          : 'border-subtle bg-white/5 text-fg-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
