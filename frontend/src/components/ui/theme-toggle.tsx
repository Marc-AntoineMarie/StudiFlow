'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(getStoredTheme() ?? 'dark');
  }, []);

  function basculer() {
    const suivant: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(suivant);
    applyTheme(suivant);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label="Basculer le thème clair/sombre"
      title={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-[var(--surface-1)] text-fg-muted transition-colors hover:text-fg"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
