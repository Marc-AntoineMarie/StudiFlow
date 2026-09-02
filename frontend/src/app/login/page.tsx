'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard, Film, LogIn, Mail, Lock, UserPlus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken, saveToken } from '@/lib/auth';

interface AuthResponse {
  token: string;
  expiresIn: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [setupRequise, setSetupRequise] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Déjà connecté ? Inutile de revoir le formulaire.
  useEffect(() => {
    if (getToken()) {
      router.replace('/missions');
      return;
    }
    apiFetch<{ requise: boolean }>('/auth/setup-requise')
      .then((r) => setSetupRequise(r.requise))
      .catch(() => setSetupRequise(false)); // par prudence, retombe sur la connexion
  }, [router]);

  async function onSubmitConnexion(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { token } = await apiFetch<AuthResponse>('/auth/login', {
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

  async function onSubmitCreation(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (password !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setEnCours(true);
    try {
      const { token } = await apiFetch<AuthResponse>('/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveToken(token);
      router.push('/missions');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Création du compte impossible.');
    } finally {
      setEnCours(false);
    }
  }

  const modeCreation = setupRequise === true;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-app bg-dot-grid px-6 py-16">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
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

        {/* Carte de connexion / création */}
        <Card className="order-1 p-8 lg:order-2">
          {setupRequise === null ? (
            <p className="text-sm text-fg-muted">Chargement…</p>
          ) : modeCreation ? (
            <>
              <h2 className="font-heading text-2xl font-semibold text-fg">Créer votre compte</h2>
              <p className="mt-2 text-sm text-fg-muted">
                Premier lancement : aucun compte n&apos;existe encore. Créez le vôtre —
                unique, cette création ne sera plus possible ensuite.
              </p>

              <form className="mt-8 space-y-4" onSubmit={onSubmitCreation}>
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
                    placeholder="vous@exemple.fr"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-fg-muted">
                    Mot de passe
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    icon={<Lock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                  />
                </div>

                <div>
                  <label htmlFor="confirmation" className="mb-1.5 block text-xs font-medium text-fg-muted">
                    Confirmer le mot de passe
                  </label>
                  <Input
                    id="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    icon={<Lock size={16} />}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="••••••••••"
                  />
                </div>

                {erreur && (
                  <p className="rounded-lg border border-accent-pink/30 bg-accent-pink/10 px-3 py-2 text-sm text-accent-pink">
                    {erreur}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={enCours}>
                  <UserPlus size={16} />
                  {enCours ? 'Création…' : 'Créer mon compte'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-heading text-2xl font-semibold text-fg">Connexion</h2>
              <p className="mt-2 text-sm text-fg-muted">
                Application privée mono-utilisateur pour piloter missions, documents et
                portfolio.
              </p>

              <form className="mt-8 space-y-4" onSubmit={onSubmitConnexion}>
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
                    placeholder="demo@studiflow.local"
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
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
