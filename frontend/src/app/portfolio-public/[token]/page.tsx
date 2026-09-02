'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Clapperboard, Download, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { LienPortfolioPublic, Projet } from '@/lib/types';
import { TAG_BADGE_CLASS, TAG_LABEL, formatDateProjet } from '@/lib/projet-format';
import { urlEmbed, urlMiniature } from '@/lib/video-embed';
import { genererHtmlHorsLigne, telechargerHtml } from '@/lib/portfolio-offline-export';

/** Carte de lecture seule, sans les actions d'édition (page publique, pas d'auth). */
function ProjetCardPublic({ projet }: { projet: Projet }) {
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const miniature = urlMiniature(projet.lienVideo);
  const embed = urlEmbed(projet.lienVideo);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--surface-1)] sm:w-48">
          {miniature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={miniature} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-blue/20 via-accent-purple/20 to-accent-gold/20">
              <Play size={26} className="text-fg-muted" />
            </div>
          )}
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
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => setApercuOuvert((v) => !v)}
            disabled={!embed}
          >
            <ChevronDown size={14} className={`transition-transform ${apercuOuvert ? 'rotate-180' : ''}`} />
            Aperçu
          </Button>
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

export default function PortfolioPublicPage() {
  const params = useParams<{ token: string }>();
  const [donnees, setDonnees] = useState<LienPortfolioPublic | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enExport, setEnExport] = useState(false);

  useEffect(() => {
    apiFetch<LienPortfolioPublic>(`/portfolio-liens/${params.token}/public`)
      .then(setDonnees)
      .catch((err) => {
        setErreur(
          err instanceof ApiError && err.status === 404
            ? "Ce lien n'existe plus ou n'a jamais existé."
            : 'Impossible de charger ce portfolio.',
        );
      });
  }, [params.token]);

  async function onExporter() {
    if (!donnees) return;
    setEnExport(true);
    try {
      const html = await genererHtmlHorsLigne(donnees.titre, donnees.projets);
      const nom = (donnees.titre ?? 'portfolio').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      telechargerHtml(html, `${nom || 'portfolio'}.html`);
    } finally {
      setEnExport(false);
    }
  }

  return (
    <div className="min-h-screen bg-app bg-dot-grid">
      <header className="border-b border-subtle bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
            <Clapperboard size={18} />
          </span>
          <span className="font-heading text-sm font-semibold text-fg">Studiflow</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {erreur && <p className="text-accent-pink">{erreur}</p>}
        {!donnees && !erreur && <p className="text-fg-muted">Chargement…</p>}

        {donnees && (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl font-semibold text-fg">
                  {donnees.titre ?? 'Portfolio'}
                </h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {donnees.projets.length} projet{donnees.projets.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="ghost" onClick={onExporter} disabled={enExport}>
                <Download size={16} />
                {enExport ? 'Génération…' : 'Télécharger pour consultation hors-ligne'}
              </Button>
            </div>

            <div className="grid gap-4">
              {donnees.projets.map((p) => (
                <ProjetCardPublic key={p.id} projet={p} />
              ))}
              {donnees.projets.length === 0 && (
                <p className="py-10 text-center text-sm text-fg-muted">
                  Aucun projet dans cette sélection.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
