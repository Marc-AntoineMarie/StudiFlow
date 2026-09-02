'use client';

import { useState } from 'react';
import { Building2, Check, ChevronDown, PenLine, Play, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Projet } from '@/lib/types';
import { TAG_BADGE_CLASS, TAG_LABEL, formatDateProjet } from '@/lib/projet-format';
import { urlEmbed, urlMiniature } from '@/lib/video-embed';

interface ProjetCardProps {
  projet: Projet;
  onEdit: (projet: Projet) => void;
  /** Mode "créer un lien de partage" : la carte devient cochable, l'édition est désactivée. */
  modeSelection?: boolean;
  selectionne?: boolean;
  onToggleSelection?: (projet: Projet) => void;
}

export function ProjetCard({
  projet,
  onEdit,
  modeSelection,
  selectionne,
  onToggleSelection,
}: ProjetCardProps) {
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const miniature = urlMiniature(projet.lienVideo);
  const embed = urlEmbed(projet.lienVideo);

  return (
    <Card
      className={`relative overflow-hidden p-0 transition-colors ${
        modeSelection ? 'cursor-pointer' : ''
      } ${selectionne ? 'border-accent-blue ring-1 ring-accent-blue' : ''}`}
      onClick={modeSelection ? () => onToggleSelection?.(projet) : undefined}
    >
      {modeSelection && (
        <span
          className={`absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
            selectionne
              ? 'border-accent-blue bg-accent-blue text-white'
              : 'border-subtle bg-[var(--surface-1)] text-transparent'
          }`}
        >
          <Check size={14} />
        </span>
      )}
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--surface-1)] sm:w-48">
          {miniature ? (
            // Miniature publique YouTube — pas d'optimisation next/image nécessaire pour une seule vignette.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={miniature} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-blue/20 via-accent-purple/20 to-accent-gold/20">
              <Play size={26} className="text-fg-muted" />
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--overlay-soft)] opacity-0 transition-opacity hover:opacity-100">
            <Play size={28} className="text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-fg">{projet.titre}</p>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TAG_BADGE_CLASS[projet.tag]}`}>
              {TAG_LABEL[projet.tag]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-dim">{formatDateProjet(projet.date)}</p>
          <p className="mt-2 text-sm text-fg-muted">{projet.description}</p>

          {(projet.boiteProduction || projet.clients.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {projet.boiteProduction && (
                <span className="flex items-center gap-1 rounded-full border border-subtle bg-[var(--surface-1)] px-2.5 py-0.5 text-[11px] text-fg-muted">
                  <Building2 size={11} />
                  {projet.boiteProduction}
                </span>
              )}
              {projet.clients.map((client) => (
                <span
                  key={client}
                  className="flex items-center gap-1 rounded-full border border-subtle bg-[var(--surface-1)] px-2.5 py-0.5 text-[11px] text-fg-muted"
                >
                  <User size={11} />
                  {client}
                </span>
              ))}
            </div>
          )}

          {!modeSelection && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="ghost" onClick={() => onEdit(projet)}>
                <PenLine size={14} />
                Modifier
              </Button>
              <Button
                variant="ghost"
                onClick={() => setApercuOuvert((v) => !v)}
                disabled={!embed}
              >
                <ChevronDown size={14} className={`transition-transform ${apercuOuvert ? 'rotate-180' : ''}`} />
                Aperçu
              </Button>
            </div>
          )}
        </div>
      </div>

      {apercuOuvert && embed && (
        <div className="aspect-video w-full border-t border-subtle">
          <iframe
            src={embed}
            title={projet.titre}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </Card>
  );
}
