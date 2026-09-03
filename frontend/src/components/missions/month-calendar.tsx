'use client';

import { Plus } from 'lucide-react';
import { Mission } from '@/lib/types';
import { TYPE_BADGE_CLASS } from '@/lib/mission-format';

interface MonthCalendarProps {
  /** N'importe quelle date du mois affiché (UTC). */
  monthCursor: Date;
  missions: Mission[];
  onAddDay: (isoDate: string) => void;
  onSelectMission: (mission: Mission) => void;
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoOf(annee: number, mois: number, jour: number) {
  return `${annee}-${pad(mois + 1)}-${pad(jour)}`;
}

export function MonthCalendar({ monthCursor, missions, onAddDay, onSelectMission }: MonthCalendarProps) {
  const annee = monthCursor.getUTCFullYear();
  const mois = monthCursor.getUTCMonth();
  const premierJour = new Date(Date.UTC(annee, mois, 1));
  const nbJoursMois = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  // getUTCDay() : 0 = dimanche ... 6 = samedi → décalage pour semaine commençant lundi
  const decalage = (premierJour.getUTCDay() + 6) % 7;

  const cellules: { date: Date; horsMois: boolean }[] = [];
  for (let i = decalage; i > 0; i--) {
    cellules.push({ date: new Date(Date.UTC(annee, mois, 1 - i)), horsMois: true });
  }
  for (let j = 1; j <= nbJoursMois; j++) {
    cellules.push({ date: new Date(Date.UTC(annee, mois, j)), horsMois: false });
  }
  while (cellules.length % 7 !== 0) {
    const derniere = cellules[cellules.length - 1].date;
    cellules.push({
      date: new Date(Date.UTC(derniere.getUTCFullYear(), derniere.getUTCMonth(), derniere.getUTCDate() + 1)),
      horsMois: true,
    });
  }

  function missionsDuJour(date: Date, iso: string): Mission[] {
    const t = date.getTime();
    return missions.filter((m) => {
      // Jour par jour : seuls les jours effectivement cochés comptent — pas toute
      // la plage dateDebut→dateFin, qui inclurait des jours creux (résout la
      // confusion week-ends historique, cf. journal de bord 2026-09-03).
      if (m.modeJours === 'JOUR_PAR_JOUR') return m.joursTravailles.includes(iso);
      const debut = new Date(m.dateDebut).getTime();
      const fin = new Date(m.dateFin).getTime();
      return t >= debut && t <= fin;
    });
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[840px] grid-cols-7 gap-2">
        {JOURS.map((j) => (
          <div key={j} className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-fg-dim">
            {j}
          </div>
        ))}
        {cellules.map(({ date, horsMois }) => {
          const iso = isoOf(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
          const missionsJour = missionsDuJour(date, iso);
          return (
            <div
              key={iso}
              className={`min-h-[112px] rounded-xl border border-subtle p-2 ${
                horsMois ? 'bg-[var(--surface-3)] opacity-40' : 'bg-card'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-fg-muted">{date.getUTCDate()}</span>
                {!horsMois && (
                  <button
                    type="button"
                    onClick={() => onAddDay(iso)}
                    className="rounded-md p-0.5 text-fg-dim transition-colors hover:bg-[var(--surface-2)] hover:text-fg"
                    title="Ajouter une mission"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {missionsJour.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMission(m)}
                    title={m.titre}
                    className={`block w-full truncate rounded-lg border px-2 py-1 text-left text-[11px] font-medium ${TYPE_BADGE_CLASS[m.type]}`}
                  >
                    {m.titre}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
