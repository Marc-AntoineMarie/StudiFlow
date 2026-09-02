/**
 * Dérivation client-side de l'URL d'embed et de la miniature à partir d'un lien
 * YouTube/Vimeo brut (le backend ne stocke que le lien d'origine, cf.
 * docs/06 et le module projets côté API).
 */

export function urlEmbed(lienVideo: string): string | null {
  try {
    const u = new URL(lienVideo);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Miniature publique YouTube (pas d'appel API). Pas de miniature simple pour Vimeo. */
export function urlMiniature(lienVideo: string): string | null {
  try {
    const u = new URL(lienVideo);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    return null;
  } catch {
    return null;
  }
}
