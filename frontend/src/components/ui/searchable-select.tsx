'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Texte secondaire, gris, sous le label (ex. mission actuelle d'un document). */
  hint?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  /** Ouvre le panneau dès le montage (ex. juste après un clic "changer"). */
  autoOuvrir?: boolean;
}

/**
 * Sélecteur avec recherche intégrée — remplace un <select> à plat dès que la
 * liste d'options devient longue (missions, documents…). Ouverture au clic,
 * fermeture au clic extérieur/sélection, filtre insensible à la casse sur le
 * label ET le hint.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  className = '',
  autoOuvrir = false,
}: SearchableSelectProps) {
  const [ouvert, setOuvert] = useState(autoOuvrir);
  const [recherche, setRecherche] = useState('');
  const conteneurRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectionne = options.find((o) => o.value === value);

  useEffect(() => {
    if (!ouvert) return;
    function onClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
        setRecherche('');
      }
    }
    document.addEventListener('mousedown', onClicExterieur);
    return () => document.removeEventListener('mousedown', onClicExterieur);
  }, [ouvert]);

  useEffect(() => {
    if (ouvert) inputRef.current?.focus();
  }, [ouvert]);

  const filtres = options.filter((o) => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false);
  });

  function selectionner(v: string) {
    onChange(v);
    setOuvert(false);
    setRecherche('');
  }

  return (
    <div ref={conteneurRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-subtle bg-[var(--surface-1)] px-3 py-2.5 text-left text-sm outline-none transition-colors focus:border-accent-blue"
      >
        <span className={`truncate ${selectionne ? 'text-fg' : 'text-fg-dim'}`}>
          {selectionne ? selectionne.label : placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-fg-dim transition-transform ${ouvert ? 'rotate-180' : ''}`} />
      </button>

      {ouvert && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-subtle bg-card shadow-lg">
          <div className="border-b border-subtle p-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-dim" />
              <input
                ref={inputRef}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-lg border border-subtle bg-[var(--surface-1)] py-1.5 pl-8 pr-2 text-sm text-fg outline-none focus:border-accent-blue"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtres.length === 0 ? (
              <li className="px-3 py-2 text-sm text-fg-dim">Aucun résultat.</li>
            ) : (
              filtres.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => selectionner(o.value)}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${
                      o.value === value ? 'bg-accent-blue/10 text-accent-blue-light' : 'text-fg'
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.hint && <span className="truncate text-xs text-fg-dim">{o.hint}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
