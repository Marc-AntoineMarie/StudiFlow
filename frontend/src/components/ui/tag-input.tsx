'use client';

import { KeyboardEvent, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from './input';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/** Ajout d'éléments un par un (Entrée ou bouton +), chips retirables. */
export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [saisie, setSaisie] = useState('');

  function ajouter() {
    const v = saisie.trim();
    if (!v || value.includes(v)) {
      setSaisie('');
      return;
    }
    onChange([...value, v]);
    setSaisie('');
  }

  function retirer(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      ajouter();
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input value={saisie} onChange={(e) => setSaisie(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} />
        <button
          type="button"
          onClick={ajouter}
          className="flex items-center justify-center rounded-xl border border-subtle bg-[var(--surface-1)] px-3 text-fg-muted transition-colors hover:text-fg"
        >
          <Plus size={16} />
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full border border-subtle bg-[var(--surface-1)] px-2.5 py-1 text-xs text-fg"
            >
              {v}
              <button type="button" onClick={() => retirer(v)} className="text-fg-dim hover:text-accent-pink">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
