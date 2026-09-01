'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard, Film, LogIn, Mail, Lock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken, saveToken } from '@/lib/auth';

interface LoginResponse {
  token: string;
  expiresIn: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Déjà connecté ? Inutile de revoir le formulaire.
  useEffect(() => {
    if (getToken()) router.replace('/missions');
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { token } = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveToken(token);
      router.push('/missions');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app bg-dot-grid px-6 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Panneau décoratif — composition graphique (pas de photo externe, cf. docs/06) */}
        <div className="relative order-2 overflow-hidden rounded-card border border-subtle bg-card p-10 lg:order-1">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent-blue/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent-purple/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
              <Clapperboard size={22} />
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-purple/15 text-accent-purple">
              <Film size={22} />
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-gold/15 text-accent-gold">
              <Video size={22} />
            </span>
          </div>

          <h1 className="relative mt-10 font-heading text-4xl font-semibold leading-tight text-fg">
            Pilotage simple pour activité vidéo hybride
          </h1>
          <p className="relative mt-4 max-w-sm text-sm text-fg-muted">
            Une interface privée, calme et rapide pour suivre vos missions
            intermittence, votre freelance, vos documents et vos projets portfolio.
          </p>
        </div>

        {/* Carte de connexion */}
        <Card className="order-1 p-8 lg:order-2">
          <h2 className="font-heading text-2xl font-semibold text-fg">Connexion</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Application privée mono-utilisateur pour piloter missions, documents et
            portfolio.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-fg-muted">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@cadre.local"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-fg-muted">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
              />
            </div>

            {erreur && (
              <p className="rounded-lg border border-accent-pink/30 bg-accent-pink/10 px-3 py-2 text-sm text-accent-pink">
                {erreur}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={enCours}>
              <LogIn size={16} />
              {enCours ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
