import { Projet } from '@/lib/types';
import { urlMiniature } from '@/lib/video-embed';
import { urlMiniatureVideoHebergeePublique, urlVideoHebergeePublique } from '@/lib/video-hebergee';
import { TAG_LABEL, formatDateProjet } from '@/lib/projet-format';

/**
 * Génère un fichier HTML autonome (CSS inline, images en data: URI) pour une
 * consultation hors-ligne du portfolio sélectionné.
 *
 * - Lien externe (YouTube/Vimeo) : jamais lisible hors-ligne (plateforme
 *   tierce) — miniature embarquée + lien "voir en ligne".
 * - Vidéo hébergée par Studiflow : lecteur <video> intégré directement dans le
 *   fichier (poster = vraie vignette embarquée en data: URI). Elle ne joue que
 *   si l'appareil a du réseau ET accès à Studiflow au moment de l'ouverture —
 *   le fichier reste consultable sans connexion pour tout le reste (textes) —
 *   mais quand c'est le cas, la lecture est directe, sans changer de page.
 */

async function versDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(typeof lecteur.result === 'string' ? lecteur.result : null);
      lecteur.onerror = () => resolve(null);
      lecteur.readAsDataURL(blob);
    });
  } catch {
    return null; // miniature indisponible (CORS, Vimeo sans miniature simple…) : on continue sans
  }
}

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function genererHtmlHorsLigne(
  titre: string | null,
  projets: Projet[],
  lienToken: string,
): Promise<string> {
  const cartes = await Promise.all(
    projets.map(async (p) => {
      const estHebergee = Boolean(p.videoStockageNom);
      const miniatureUrl = estHebergee
        ? urlMiniatureVideoHebergeePublique(lienToken, p.id)
        : urlMiniature(p.lienVideo);
      const miniatureData = miniatureUrl ? await versDataUri(miniatureUrl) : null;

      const tags = [
        p.boiteProduction ? `<span class="badge">${echapperHtml(p.boiteProduction)}</span>` : '',
        ...p.clients.map((c) => `<span class="badge">${echapperHtml(c)}</span>`),
      ].join('');

      const blocMedia = estHebergee
        ? `<video class="lecteur" controls playsinline preload="none" ${
            miniatureData ? `poster="${miniatureData}"` : ''
          }>
             <source src="${echapperHtml(urlVideoHebergeePublique(lienToken, p.id))}" />
           </video>`
        : `<div class="miniature">
             ${miniatureData ? `<img src="${miniatureData}" alt="" />` : `<div class="miniature-vide">▶</div>`}
           </div>`;

      const blocApresBadges = estHebergee
        ? `<p class="note-hors-ligne">Lecture directe si connecté à Internet.</p>`
        : p.lienVideo
          ? `<a class="lien-video" href="${echapperHtml(p.lienVideo)}" target="_blank" rel="noopener noreferrer">Voir la vidéo en ligne ↗</a>`
          : '';

      return `
        <article class="carte">
          <div class="media">
            ${blocMedia}
          </div>
          <div class="contenu">
            <div class="entete">
              <h2>${echapperHtml(p.titre)}</h2>
              <span class="tag tag-${p.tag.toLowerCase()}">${p.tag === 'PRO' ? 'Pro' : 'Perso'}</span>
            </div>
            <p class="date">${formatDateProjet(p.date)}</p>
            <p class="description">${echapperHtml(p.description)}</p>
            ${tags ? `<div class="badges">${tags}</div>` : ''}
            ${blocApresBadges}
          </div>
        </article>`;
    }),
  );

  const titrePage = titre ? echapperHtml(titre) : 'Portfolio';

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titrePage}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px 20px 80px;
    background: #0b0d12; color: #e9ebf1;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif;
  }
  .page { max-width: 880px; margin: 0 auto; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  .sous-titre { color: #9aa0b0; font-size: 14px; margin: 0 0 36px; }
  .grille { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .carte {
    display: flex; flex-direction: column; background: #12151c; border: 1px solid #22262f;
    border-radius: 16px; overflow: hidden;
  }
  .media { aspect-ratio: 16 / 9; background: #1a1e28; }
  .miniature {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  }
  .miniature img { width: 100%; height: 100%; object-fit: cover; }
  .miniature-vide { font-size: 28px; color: #565d70; }
  .lecteur { width: 100%; height: 100%; display: block; background: #000; }
  .note-hors-ligne { margin: 10px 0 0; font-size: 11px; color: #565d70; }
  .contenu { padding: 18px; min-width: 0; }
  .entete { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .entete h2 { font-size: 17px; margin: 0; }
  .tag { font-size: 11px; padding: 2px 10px; border-radius: 999px; border: 1px solid; }
  .tag-pro { color: #7db8ff; border-color: #2d4a72; background: rgba(93,151,255,0.1); }
  .tag-perso { color: #c9a6ff; border-color: #4a3872; background: rgba(163,110,255,0.1); }
  .date { color: #7b8299; font-size: 12px; margin: 6px 0 0; }
  .description { color: #c3c7d4; font-size: 14px; line-height: 1.5; margin: 10px 0; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .badge {
    font-size: 11px; color: #9aa0b0; border: 1px solid #22262f; background: #1a1e28;
    padding: 2px 10px; border-radius: 999px;
  }
  .lien-video { display: block; margin: 10px 0 0; color: #7db8ff; font-size: 13px; text-decoration: none; }
  .lien-video:hover { text-decoration: underline; }
  .avis {
    margin-top: 36px; padding-top: 16px; border-top: 1px solid #22262f;
    color: #565d70; font-size: 12px;
  }
</style>
</head>
<body>
  <div class="page">
    <h1>${titrePage}</h1>
    <p class="sous-titre">${projets.length} projet${projets.length > 1 ? 's' : ''} — page exportée pour consultation hors-ligne.</p>
    <div class="grille">
      ${cartes.join('\n')}
    </div>
    <p class="avis">
      Généré depuis Studiflow. Les informations des projets sont disponibles hors-ligne ;
      la lecture des vidéos nécessite une connexion (YouTube/Vimeo, ou Studiflow pour les
      vidéos hébergées).
    </p>
  </div>
</body>
</html>`;
}

/** Déclenche le téléchargement du fichier généré. */
export function telechargerHtml(contenu: string, nomFichier: string) {
  const blob = new Blob([contenu], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
