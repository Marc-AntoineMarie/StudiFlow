'use client';

/**
 * Compteur global de requêtes en vol. Toute action passant par apiFetch/
 * apiDownloadBlob (chargement de page, sauvegarde, upload, export…) incrémente/
 * décrémente ce compteur — un seul mécanisme pour couvrir à la fois les
 * transitions de page ET les actions plus lentes, sans instrumenter chaque
 * composant individuellement.
 */
let compte = 0;
const listeners = new Set<() => void>();

function notifier() {
  listeners.forEach((l) => l());
}

export function demarrerChargement() {
  compte++;
  notifier();
}

export function terminerChargement() {
  compte = Math.max(0, compte - 1);
  notifier();
}

export function estEnChargement(): boolean {
  return compte > 0;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
