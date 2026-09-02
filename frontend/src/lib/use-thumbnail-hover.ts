'use client';

import { useEffect, useRef, useState } from 'react';
import { apiDownloadBlob } from '@/lib/api';

const MIME_AVEC_VIGNETTE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

/**
 * Aperçu flottant au survol d'un document (vignette PDF/image mise en cache, suit
 * le curseur). Partagé entre la table Documents et la liste "attachés" du dialog
 * mission — même mécanique, même cache de blobs.
 */
export function useThumbnailHover() {
  const [survoleId, setSurvoleId] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [url, setUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const cache = useRef<Map<number, string | null>>(new Map());

  useEffect(() => {
    const urls = cache.current;
    return () => {
      urls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, []);

  async function survoler(doc: { id: number; mimeType: string }) {
    setSurvoleId(doc.id);
    if (!MIME_AVEC_VIGNETTE.has(doc.mimeType)) {
      setUrl(null);
      return;
    }
    if (cache.current.has(doc.id)) {
      setUrl(cache.current.get(doc.id) ?? null);
      return;
    }
    setChargement(true);
    setUrl(null);
    try {
      const blob = await apiDownloadBlob(`/documents/${doc.id}/thumbnail`);
      const u = URL.createObjectURL(blob);
      cache.current.set(doc.id, u);
      setUrl(u);
    } catch {
      cache.current.set(doc.id, null); // pas de vignette dispo : ne pas retenter
      setUrl(null);
    } finally {
      setChargement(false);
    }
  }

  function quitter() {
    setSurvoleId(null);
  }

  function bouger(e: { clientX: number; clientY: number }) {
    setPosition({ x: e.clientX, y: e.clientY });
  }

  return { survoleId, position, url, chargement, survoler, quitter, bouger };
}
