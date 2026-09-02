'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface PartClient {
  client: string;
  valeur: number;
  pourcentage: number;
}

export interface RepartitionClients {
  activite: PartClient[];
  ca: PartClient[];
  nbMissions: PartClient[];
}

type Metrique = 'activite' | 'ca' | 'nbMissions';

const ONGLETS: { cle: Metrique; label: string }[] = [
  { cle: 'activite', label: 'Activité' },
  { cle: 'ca', label: 'CA' },
  { cle: 'nbMissions', label: 'Nb missions' },
];

/** Formatte la valeur brute selon la métrique (h, €, ou nombre entier). */
function formatValeur(valeur: number, metrique: Metrique): string {
  if (metrique === 'ca') return `${Math.round(valeur).toLocaleString('fr-FR')} €`;
  if (metrique === 'nbMissions') return `${valeur}`;
  return `${Math.round(valeur * 10) / 10} h`;
}

export function RepartitionClients({ data }: { data: RepartitionClients }) {
  const [metrique, setMetrique] = useState<Metrique>('activite');
  const lignes = data[metrique];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {ONGLETS.map((o) => (
          <Button
            key={o.cle}
            variant={metrique === o.cle ? 'primary' : 'ghost'}
            className="px-3 py-1.5 text-xs"
            onClick={() => setMetrique(o.cle)}
          >
            {o.label}
          </Button>
        ))}
      </div>

      {lignes.length === 0 ? (
        <p className="text-sm text-fg-muted">Pas encore de mission comptabilisée.</p>
      ) : (
        <ul className="space-y-3">
          {lignes.map((ligne) => (
            <li key={ligne.client}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className={ligne.client === 'Autres' ? 'text-fg-dim' : 'text-fg'}>
                  {ligne.client}
                </span>
                <span className="shrink-0 font-medium text-fg-muted">
                  {Math.round(ligne.pourcentage * 100)}% · {formatValeur(ligne.valeur, metrique)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-1)]">
                <div
                  className={`h-full rounded-full ${ligne.client === 'Autres' ? 'bg-fg-dim' : 'bg-accent-purple'}`}
                  style={{ width: `${Math.min(100, ligne.pourcentage * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
