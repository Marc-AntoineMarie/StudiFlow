'use client';

import { FileText } from 'lucide-react';

interface ThumbnailPopoverProps {
  position: { x: number; y: number };
  chargement: boolean;
  url: string | null;
  nomFichier: string;
}

/** Vignette flottante affichée par useThumbnailHover (positionnement au survol). */
export function ThumbnailPopover({ position, chargement, url, nomFichier }: ThumbnailPopoverProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 w-48 overflow-hidden rounded-card border border-subtle bg-card shadow-lg"
      style={{ left: position.x + 16, top: position.y + 16 }}
    >
      <div className="flex h-32 w-full items-center justify-center bg-[var(--surface-1)]">
        {chargement ? (
          <span className="text-xs text-fg-dim">Chargement…</span>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-contain" />
        ) : (
          <FileText size={28} className="text-fg-dim" />
        )}
      </div>
      <p className="truncate px-2 py-1.5 text-xs text-fg-muted">{nomFichier}</p>
    </div>
  );
}
