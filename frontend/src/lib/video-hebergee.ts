import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api';

/**
 * URL de lecture d'une vidéo hébergée dans l'app authentifiée. Un <video src="…">
 * ne peut pas poser de header Authorization : le jeton passe donc en `?token=`
 * (vérifié manuellement côté backend pour cette seule route, cf.
 * ProjetsController.lireVideo). null si l'utilisateur n'est pas connecté.
 */
export function urlVideoHebergee(projetId: number): string | null {
  const token = getToken();
  if (!token) return null;
  return `${API_URL}/projets/${projetId}/video?token=${encodeURIComponent(token)}`;
}

/** URL publique (lien portfolio) — scoping déjà assuré côté backend par le token du lien. */
export function urlVideoHebergeePublique(lienToken: string, projetId: number): string {
  return `${API_URL}/portfolio-liens/${lienToken}/video/${projetId}`;
}
