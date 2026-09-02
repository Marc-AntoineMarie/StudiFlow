'use client';

import { AlertTriangle, CalendarClock, FileWarning, Gauge, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Rappel, TypeRappel } from '@/lib/types';

const ICONE: Record<TypeRappel, LucideIcon> = {
  FIN_CONTRAT: CalendarClock,
  DOCUMENT_MANQUANT: FileWarning,
  SEUIL_HEURES: Gauge,
};

const COULEUR: Record<TypeRappel, string> = {
  FIN_CONTRAT: 'text-accent-gold bg-accent-gold/15',
  DOCUMENT_MANQUANT: 'text-accent-pink bg-accent-pink/15',
  SEUIL_HEURES: 'text-accent-blue bg-accent-blue/15',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export function RappelsPanel({ rappels }: { rappels: Rappel[] }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
        <AlertTriangle size={14} className="text-accent-gold" />
        Rappels
      </div>

      {rappels.length === 0 ? (
        <p className="text-sm text-fg-muted">Rien à signaler — tout est à jour.</p>
      ) : (
        <ul className="space-y-3">
          {rappels.map((r, i) => {
            const Icone = ICONE[r.type];
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${COULEUR[r.type]}`}
                >
                  <Icone size={14} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">
                    {r.titre}
                    {r.dateFin && (
                      <span className="ml-2 text-xs font-normal text-fg-dim">{formatDate(r.dateFin)}</span>
                    )}
                  </p>
                  <p className="text-xs text-fg-muted">{r.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
