'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LienPortfolio } from '@/lib/types';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

function urlPublique(token: string) {
  return `${window.location.origin}/portfolio-public/${token}`;
}

export function LiensPanel({ liens, onDelete }: { liens: LienPortfolio[]; onDelete: (id: number) => void }) {
  const [copieToken, setCopieToken] = useState<string | null>(null);

  async function copier(token: string) {
    try {
      await navigator.clipboard.writeText(urlPublique(token));
      setCopieToken(token);
      setTimeout(() => setCopieToken((t) => (t === token ? null : t)), 1800);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) :
      // pas bloquant, l'utilisateur peut toujours copier l'URL depuis "Ouvrir".
    }
  }

  if (liens.length === 0) return null;

  return (
    <Card className="mt-6 p-6">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
        <Link2 size={14} className="text-accent-blue" />
        Liens de partage
      </p>
      <ul className="space-y-2">
        {liens.map((lien) => (
          <li
            key={lien.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-subtle bg-[var(--surface-1)] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{lien.titre ?? 'Sans titre'}</p>
              <p className="text-xs text-fg-dim">
                {lien.projetIds.length} projet{lien.projetIds.length > 1 ? 's' : ''} · créé le{' '}
                {formatDate(lien.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => copier(lien.token)}
                title="Copier le lien"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-[var(--surface-2)] hover:text-fg"
              >
                {copieToken === lien.token ? <Check size={15} className="text-accent-blue-light" /> : <Copy size={15} />}
              </button>
              <a
                href={urlPublique(lien.token)}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-[var(--surface-2)] hover:text-fg"
              >
                <ExternalLink size={15} />
              </a>
              <button
                type="button"
                onClick={() => onDelete(lien.id)}
                title="Supprimer le lien"
                className="rounded-lg p-2 text-fg-dim transition-colors hover:bg-accent-pink/15 hover:text-accent-pink"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
