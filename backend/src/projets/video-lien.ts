/**
 * Validation du lien vidéo d'un projet (brief : « le lien vidéo est la voie
 * principale », doit pointer vers YouTube ou Vimeo). Fonction pure, testée seule.
 */
const HOTES_YOUTUBE = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be']);
const HOTES_VIMEO = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

export function estLienVideoValide(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return HOTES_YOUTUBE.has(hostname) || HOTES_VIMEO.has(hostname);
  } catch {
    return false;
  }
}
