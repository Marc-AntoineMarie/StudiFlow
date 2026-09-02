'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { estEnChargement, subscribe } from '@/lib/loading-store';

/**
 * Barre de progression fine en haut de page (style GitHub/YouTube), déclenchée
 * par TOUTE requête apiFetch/apiDownloadBlob — couvre à la fois les transitions
 * de page (chaque page charge ses données au montage) et les actions plus
 * lentes (upload, export, PDF…), sans avoir à instrumenter chaque écran.
 *
 * Ne bloque jamais l'interaction (pointer-events: none) : c'est un indice
 * visuel, pas un overlay.
 */
export function TopLoadingBar() {
  const enChargement = useSyncExternalStore(subscribe, estEnChargement, () => false);
  const [visible, setVisible] = useState(false);
  const [largeur, setLargeur] = useState(0);

  useEffect(() => {
    let delaiDisparition: ReturnType<typeof setTimeout> | undefined;
    let delaiProgression: ReturnType<typeof setTimeout> | undefined;

    if (enChargement) {
      setVisible(true);
      setLargeur(0);
      // Démarre la progression après le prochain tick pour que la transition
      // CSS parte bien de 0 (sinon le navigateur fusionne les deux états).
      delaiProgression = setTimeout(() => setLargeur(80), 30);
    } else {
      setLargeur(100);
      delaiDisparition = setTimeout(() => {
        setVisible(false);
        setLargeur(0);
      }, 250);
    }

    return () => {
      clearTimeout(delaiProgression);
      clearTimeout(delaiDisparition);
    };
  }, [enChargement]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[100] h-[3px] w-full bg-transparent">
      <div
        className="h-full bg-accent-blue transition-[width] duration-300 ease-out"
        style={{ width: `${largeur}%` }}
      />
    </div>
  );
}
