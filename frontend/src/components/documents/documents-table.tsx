'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Link2, Trash2 } from 'lucide-react';
import { AppDocument, Mission } from '@/lib/types';
import { CATEGORIE_LABEL, formatDate, formatTaille } from '@/lib/document-format';
import { apiDownloadBlob } from '@/lib/api';
import { Select } from '@/components/ui/select';

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

const MIME_AVEC_VIGNETTE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

export function DocumentsTable({
  documents,
  missions,
  onDownload,
  onDelete,
  onPreview,
  onLierMission,
}: DocumentsTableProps) {
  const router = useRouter();
  const [survole, setSurvole] = useState<AppDocument | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [urlVignette, setUrlVignette] = useState<string | null>(null);
  const [chargementVignette, setChargementVignette] = useState(false);
  const [editionMissionId, setEditionMissionId] = useState<number | null>(null);
  const cache = useRef<Map<number, string | null>>(new Map());

  // Les URL d'objet créées pour les vignettes ne servent qu'à cette page : on les
  // libère à la fermeture pour ne pas accumuler de mémoire.
  useEffect(() => {
    const urls = cache.current;
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, []);

  async function onSurvolLigne(doc: AppDocument) {
    setSurvole(doc);
    if (!MIME_AVEC_VIGNETTE.has(doc.mimeType)) {
      setUrlVignette(null);
      return;
    }
    if (cache.current.has(doc.id)) {
      setUrlVignette(cache.current.get(doc.id) ?? null);
      return;
    }
    setChargementVignette(true);
    setUrlVignette(null);
    try {
      const blob = await apiDownloadBlob(`/documents/${doc.id}/thumbnail`);
      const url = URL.createObjectURL(blob);
      cache.current.set(doc.id, url);
      setUrlVignette(url);
    } catch {
      cache.current.set(doc.id, null); // pas de vignette dispo (ex. autre type) : ne pas retenter
      setUrlVignette(null);
    } finally {
      setChargementVignette(false);
    }
  }

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
              onMouseEnter={() => onSurvolLigne(doc)}
              onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setSurvole(null)}
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

      {survole && (
        <div
          className="pointer-events-none fixed z-50 w-48 overflow-hidden rounded-card border border-subtle bg-card shadow-lg"
          style={{ left: position.x + 16, top: position.y + 16 }}
        >
          <div className="flex h-32 w-full items-center justify-center bg-[var(--surface-1)]">
            {chargementVignette ? (
              <span className="text-xs text-fg-dim">Chargement…</span>
            ) : urlVignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlVignette} alt="" className="h-full w-full object-contain" />
            ) : (
              <FileText size={28} className="text-fg-dim" />
            )}
          </div>
          <p className="truncate px-2 py-1.5 text-xs text-fg-muted">{survole.nomFichier}</p>
        </div>
      )}
    </div>
  );
}
