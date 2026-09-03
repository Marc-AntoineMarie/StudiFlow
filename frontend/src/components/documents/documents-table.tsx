'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Link2, Trash2 } from 'lucide-react';
import { AppDocument, Mission } from '@/lib/types';
import { CATEGORIE_LABEL, formatDate, formatTaille } from '@/lib/document-format';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ThumbnailPopover } from '@/components/documents/thumbnail-popover';
import { useThumbnailHover } from '@/lib/use-thumbnail-hover';

interface DocumentsTableProps {
  documents: AppDocument[];
  missions: Mission[];
  onDownload: (doc: AppDocument) => void;
  onDelete: (doc: AppDocument) => void;
  /** Clic sur la ligne : ouvre le fichier pour consultation (pas un téléchargement forcé). */
  onPreview: (doc: AppDocument) => void;
  /** missionId: null = détache (retour au dépôt global). */
  onLierMission: (doc: AppDocument, missionId: number | null) => Promise<void>;
}

const TAILLE_PAGE = 12;

export function DocumentsTable({
  documents,
  missions,
  onDownload,
  onDelete,
  onPreview,
  onLierMission,
}: DocumentsTableProps) {
  const router = useRouter();
  const [editionMissionId, setEditionMissionId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const vignette = useThumbnailHover();
  const docSurvole = documents.find((d) => d.id === vignette.survoleId);

  // Revient à la page 1 à chaque nouveau résultat filtré (sinon on peut se
  // retrouver sur une page qui n'existe plus après un changement de filtre).
  useEffect(() => {
    setPage(1);
  }, [documents]);

  if (documents.length === 0) {
    return <p className="py-10 text-center text-sm text-fg-muted">Aucun document ne correspond aux filtres.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(documents.length / TAILLE_PAGE));
  const pageBornee = Math.min(page, totalPages);
  const documentsPage = documents.slice((pageBornee - 1) * TAILLE_PAGE, pageBornee * TAILLE_PAGE);

  return (
    <div>
    <div className="relative overflow-x-auto rounded-card border border-subtle">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-subtle text-xs uppercase tracking-wide text-fg-dim">
            <th className="px-4 py-3 font-medium">Nom</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Mission</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Taille</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documentsPage.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => onPreview(doc)}
              onMouseEnter={() => vignette.survoler(doc)}
              onMouseMove={vignette.bouger}
              onMouseLeave={vignette.quitter}
              className="cursor-pointer border-b border-subtle/60 transition-colors last:border-0 hover:bg-[var(--surface-3)]"
            >
              <td className="px-4 py-3 text-fg">{doc.nomFichier}</td>
              <td className="px-4 py-3 text-fg-muted">{CATEGORIE_LABEL[doc.categorie]}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {editionMissionId === doc.id ? (
                  <SearchableSelect
                    className="min-w-[220px]"
                    autoOuvrir
                    value={doc.missionId ? String(doc.missionId) : ''}
                    onChange={async (valeur) => {
                      setEditionMissionId(null);
                      await onLierMission(doc, valeur ? Number(valeur) : null);
                    }}
                    placeholder="Dépôt global"
                    options={[
                      { value: '', label: 'Dépôt global' },
                      ...missions.map((m) => ({ value: String(m.id), label: m.titre })),
                    ]}
                  />
                ) : doc.mission ? (
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <button
                      type="button"
                      onClick={() => router.push(`/missions?id=${doc.mission!.id}`)}
                      className="truncate hover:text-accent-blue-light hover:underline"
                    >
                      {doc.mission.titre}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditionMissionId(doc.id)}
                      title="Changer de mission"
                      className="shrink-0 text-fg-dim hover:text-fg"
                    >
                      <Link2 size={13} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditionMissionId(doc.id)}
                    className="flex items-center gap-1.5 text-fg-dim hover:text-fg hover:underline"
                  >
                    Dépôt global
                    <Link2 size={13} />
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-fg-muted">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3 text-fg-muted">{formatTaille(doc.tailleOctets)}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDownload(doc)}
                    title="Télécharger"
                    className="rounded-lg bg-accent-blue/15 p-2 text-accent-blue-light transition-colors hover:bg-accent-blue/25"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(doc)}
                    title="Supprimer"
                    className="rounded-lg bg-accent-pink/15 p-2 text-accent-pink transition-colors hover:bg-accent-pink/25"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {docSurvole && (
        <ThumbnailPopover
          position={vignette.position}
          chargement={vignette.chargement}
          url={vignette.url}
          nomFichier={docSurvole.nomFichier}
        />
      )}
    </div>

    {totalPages > 1 && (
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-fg-dim">
          {documents.length} document{documents.length > 1 ? 's' : ''} — page {pageBornee} sur {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageBornee === 1}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageBornee === totalPages}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
