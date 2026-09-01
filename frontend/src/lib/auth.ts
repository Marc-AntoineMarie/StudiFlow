const TOKEN_KEY = 'cadre_token';

/**
 * Jeton en localStorage (choix validé au cadrage : simple, cookie httpOnly en
 * durcissement roadmap). Toujours no-op côté serveur (SSR).
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}
