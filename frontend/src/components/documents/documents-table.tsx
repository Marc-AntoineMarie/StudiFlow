'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Link2, Trash2 } from 'lucide-react';
import { AppDocument, Mission } from '@/lib/types';
import { CATEGORIE_LABEL, formatDate, formatTaille } from '@/lib/document-format';
import { Select } from '@/components/ui/select';
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
  const vignette = useThumbnailHover();
  const docSurvole = documents.find((d) => d.id === vignette.survoleId);

  if (documents.length === 0) {
    return <p className="py-10 text-center text-sm text-fg-muted">Aucun document ne correspond aux filtres.</p>;
  }

  return (
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
          {documents.map((doc) => (
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
                  <Select
                    autoFocus
                    value={doc.missionId ?? ''}
                    onChange={async (e) => {
                      const valeur = e.target.value;
                      setEditionMissionId(null);
                      await onLierMission(doc, valeur ? Number(valeur) : null);
                    }}
                    onBlur={() => setEditionMissionId(null)}
                  >
                    <option value="">Dépôt global</option>
                    {missions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.titre}
                      </option>
                    ))}
                  </Select>
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
  );
}
