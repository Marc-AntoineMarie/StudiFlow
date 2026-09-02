'use client';

import { Mission } from '@/lib/types';
import { STATUT_LABEL, TYPE_BADGE_CLASS, TYPE_LABEL } from '@/lib/mission-format';

interface MissionsListProps {
  missions: Mission[];
  onSelect: (mission: Mission) => void;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

function formatValeur(m: Mission) {
  if (m.type === 'INTERMITTENCE') return `${m.heures ?? 0} h`;
  return `${(m.montantHT ?? 0).toLocaleString('fr-FR')} € · ${m.nbJours ?? 0} j`;
}

export function MissionsList({ missions, onSelect }: MissionsListProps) {
  if (missions.length === 0) {
    return <p className="py-10 text-center text-sm text-fg-muted">Aucune mission ne correspond aux filtres.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-subtle">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-subtle text-xs uppercase tracking-wide text-fg-dim">
            <th className="px-4 py-3 font-medium">Mission</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Valeur</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <tr
              key={m.id}
              onClick={() => onSelect(m)}
              className="cursor-pointer border-b border-subtle/60 transition-colors last:border-0 hover:bg-[var(--surface-3)]"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-fg">{m.titre}</p>
                <p className="text-xs text-fg-muted">{m.clientOuProduction}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${TYPE_BADGE_CLASS[m.type]}`}>
                  {TYPE_LABEL[m.type]}
                </span>
              </td>
              <td className="px-4 py-3 text-fg-muted">{STATUT_LABEL[m.statut]}</td>
              <td className="px-4 py-3 text-fg-muted">
                {formatDate(m.dateDebut)} → {formatDate(m.dateFin)}
              </td>
              <td className="px-4 py-3 text-fg">{formatValeur(m)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
