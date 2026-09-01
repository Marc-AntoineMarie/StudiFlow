import type { Config } from 'tailwindcss';

/**
 * Direction artistique : voir docs/06-direction-artistique.md
 * Toutes les couleurs pointent vers des variables CSS définies dans globals.css
 * (palette unique pour l'instant, pas de bascule clair/sombre au MVP).
 */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        app: 'var(--bg)',
        card: 'var(--bg-elevated)',
        subtle: 'var(--border)',
        fg: 'var(--text-primary)',
        'fg-muted': 'var(--text-secondary)',
        'fg-dim': 'var(--text-muted)',
        'accent-blue': 'var(--accent-blue)',
        'accent-blue-light': 'var(--accent-blue-light)',
        'accent-gold': 'var(--accent-gold)',
        'accent-purple': 'var(--accent-purple)',
        'accent-pink': 'var(--accent-pink)',
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
