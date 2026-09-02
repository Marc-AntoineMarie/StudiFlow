export type Theme = 'dark' | 'light';

const CLE = 'cadre_theme';

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(CLE);
  return v === 'light' || v === 'dark' ? v : null;
}

/** Pose l'attribut sur <html> (lu par globals.css) et mémorise le choix. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(CLE, theme);
}

/**
 * Script exécuté de manière synchrone dans <head>, avant le premier paint, pour
 * éviter un flash du thème sombre par défaut si l'utilisateur a choisi le clair.
 */
export const SCRIPT_THEME_INLINE = `
try {
  var t = localStorage.getItem('${CLE}');
  if (t === 'light' || t === 'dark') {
    document.documentElement.setAttribute('data-theme', t);
  }
} catch (e) {}
`;
