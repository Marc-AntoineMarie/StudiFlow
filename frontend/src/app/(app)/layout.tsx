'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clapperboard, FolderOpen, Images, LayoutDashboard, ListChecks, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { clearToken, getToken } from '@/lib/auth';

const NAV = [
  { href: '/missions', label: 'Missions', icon: ListChecks },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/portfolio', label: 'Portfolio', icon: Images },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  function seDeconnecter() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-app bg-dot-grid">
      <header className="border-b border-subtle bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
                <Clapperboard size={18} />
              </span>
              <span className="font-heading text-sm font-semibold text-fg">Cadré</span>
            </div>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map(({ href, label, icon: Icon }) => {
                const actif = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      actif ? 'bg-[var(--surface-2)] text-fg' : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={seDeconnecter}>
              <LogOut size={16} />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
