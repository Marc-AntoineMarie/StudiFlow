'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface DayPickerProps {
  value: string[]; // "YYYY-MM-DD"
  onChange: (jours: string[]) => void;
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoOf(annee: number, mois: number, jour: number) {
  return `${annee}-${pad(mois + 1)}-${pad(jour)}`;
}

function moisDeDepart(value: string[]): Date {
  const derniere = [...value].sort().pop();
  const [y, m] = (derniere ?? new Date().toISOString().slice(0, 10)).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

/**
 * Mini calendrier de sélection multi-jours (mode "jour par jour" d'une mission
 * freelance) — distinct de MonthCalendar (qui affiche des missions, pas une
 * sélection). Week-ends visuellement estompés mais cliquables : rien n'empêche
 * de bosser un samedi, c'est juste un repère visuel.
 */
export function DayPicker({ value, onChange }: DayPickerProps) {
  const [moisCursor, setMoisCursor] = useState<Date>(() => moisDeDepart(value));

  const annee = moisCursor.getUTCFullYear();
  const mois = moisCursor.getUTCMonth();
  const premierJour = new Date(Date.UTC(annee, mois, 1));
  const nbJoursMois = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  const decalage = (premierJour.getUTCDay() + 6) % 7; // lundi = 0

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

  const ensembleValeurs = new Set(value);

  function toggle(iso: string) {
    const suivant = new Set(ensembleValeurs);
    if (suivant.has(iso)) suivant.delete(iso);
    else suivant.add(iso);
    onChange([...suivant].sort());
  }

  function changerMois(delta: number) {
    setMoisCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + delta, 1)));
  }

  const labelMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(moisCursor);

  return (
    <div className="rounded-lg border border-subtle p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changerMois(-1)}
          className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium capitalize text-fg">{labelMois}</p>
        <button
          type="button"
          onClick={() => changerMois(1)}
          className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j, i) => (
          <div
            key={j}
            className={`pb-1 text-center text-[10px] font-medium uppercase tracking-wide ${
              i >= 5 ? 'text-fg-dim/60' : 'text-fg-dim'
            }`}
          >
            {j}
          </div>
        ))}
        {cellules.map(({ date, horsMois }) => {
          const iso = isoOf(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
          const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
          const selectionne = ensembleValeurs.has(iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => toggle(iso)}
              className={`rounded-lg py-1.5 text-xs transition-colors ${
                selectionne
                  ? 'bg-accent-blue text-white'
                  : horsMois
                    ? 'text-fg-dim/50 hover:bg-[var(--surface-1)]'
                    : weekend
                      ? 'text-fg-dim hover:bg-[var(--surface-1)] hover:text-fg'
                      : 'text-fg hover:bg-[var(--surface-1)]'
              }`}
            >
              {date.getUTCDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-fg-muted">
          {value.length === 0 ? 'Aucun jour sélectionné' : `${value.length} jour${value.length > 1 ? 's' : ''} sélectionné${value.length > 1 ? 's' : ''}`}
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex items-center gap-1 text-fg-dim hover:text-accent-pink"
          >
            <RotateCcw size={12} />
            Tout retirer
          </button>
        )}
      </div>
    </div>
  );
}
