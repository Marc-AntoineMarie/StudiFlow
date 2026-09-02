'use client';

import { Mission } from '@/lib/types';
import { STATUT_LABEL, TYPE_BADGE_CLASS, TYPE_LABEL } from '@/lib/mission-format';

interface TimelineViewProps {
  missions: Mission[];
  onSelect: (mission: Mission) => void;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

function moisLabel(iso: string) {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function TimelineView({ missions, onSelect }: TimelineViewProps) {
  if (missions.length === 0) {
    return <p className="py-10 text-center text-sm text-fg-muted">Aucune mission ne correspond aux filtres.</p>;
  }

  const triees = [...missions].sort(
    (a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime(),
  );

  const groupes: { cle: string; label: string; missions: Mission[] }[] = [];
  for (const m of triees) {
    const d = new Date(m.dateDebut);
    const cle = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    let groupe = groupes.find((g) => g.cle === cle);
    if (!groupe) {
      groupe = { cle, label: moisLabel(m.dateDebut), missions: [] };
      groupes.push(groupe);
    }
    groupe.missions.push(m);
  }

  return (
    <div className="space-y-10">
      {groupes.map((g) => (
        <div key={g.cle}>
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-fg-dim">{g.label}</p>
          <div className="space-y-4 border-l border-subtle pl-6">
            {g.missions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="relative block w-full rounded-card border border-subtle bg-card p-4 text-left transition-colors hover:border-accent-blue/40"
              >
                <span
                  className={`absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-app ${
                    m.type === 'INTERMITTENCE' ? 'bg-accent-blue' : 'bg-accent-gold'
                  }`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-fg">{m.titre}</p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE_CLASS[m.type]}`}
                  >
                    {TYPE_LABEL[m.type]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-muted">{m.clientOuProduction}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-fg-dim">
                  <span>
                    {formatDate(m.dateDebut)} → {formatDate(m.dateFin)}
                  </span>
                  <span>·</span>
                  <span>{STATUT_LABEL[m.statut]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
