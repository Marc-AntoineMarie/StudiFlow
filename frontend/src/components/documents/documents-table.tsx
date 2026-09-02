'use client';

import { Download, Trash2 } from 'lucide-react';
import { AppDocument } from '@/lib/types';
import { CATEGORIE_LABEL, formatDate, formatTaille } from '@/lib/document-format';

interface DocumentsTableProps {
  documents: AppDocument[];
  onDownload: (doc: AppDocument) => void;
  onDelete: (doc: AppDocument) => void;
}

export function DocumentsTable({ documents, onDownload, onDelete }: DocumentsTableProps) {
  if (documents.length === 0) {
    return <p className="py-10 text-center text-sm text-fg-muted">Aucun document ne correspond aux filtres.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-subtle">
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
            <tr key={doc.id} className="border-b border-subtle/60 transition-colors last:border-0 hover:bg-[var(--surface-3)]">
              <td className="px-4 py-3 text-fg">{doc.nomFichier}</td>
              <td className="px-4 py-3 text-fg-muted">{CATEGORIE_LABEL[doc.categorie]}</td>
              <td className="px-4 py-3 text-fg-muted">{doc.mission?.titre ?? 'Dépôt global'}</td>
              <td className="px-4 py-3 text-fg-muted">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3 text-fg-muted">{formatTaille(doc.tailleOctets)}</td>
              <td className="px-4 py-3">
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
    </div>
  );
}
