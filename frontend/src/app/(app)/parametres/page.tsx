'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';
import { Config } from '@/lib/types';

export default function ParametresPage() {
  const [seuilHeures, setSeuilHeures] = useState('');
  const [dureeFenetreMois, setDureeFenetreMois] = useState('');
  const [journeeTypeHeures, setJourneeTypeHeures] = useState('');
  const [heuresParCachet, setHeuresParCachet] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    apiFetch<Config>('/parametres').then((c) => {
      setSeuilHeures(String(c.seuilHeures));
      setDureeFenetreMois(String(c.dureeFenetreMois));
      setJourneeTypeHeures(String(c.journeeTypeHeures));
      setHeuresParCachet(String(c.heuresParCachet));
      setChargement(false);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnregistrement(true);
    try {
      await apiFetch('/parametres', {
        method: 'PATCH',
        body: JSON.stringify({
          seuilHeures: Number(seuilHeures),
          dureeFenetreMois: Number(dureeFenetreMois),
          journeeTypeHeures: Number(journeeTypeHeures),
          heuresParCachet: Number(heuresParCachet),
        }),
      });
      setSucces(true);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-fg">Paramètres</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Les règles de calcul (seuil, fenêtre, journée type, cachets) vivent ici — jamais figées dans le code.
      </p>

      {chargement ? (
        <p className="mt-8 text-fg-muted">Chargement…</p>
      ) : (
        <Card className="mt-8 max-w-xl p-6">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Seuil de référence (heures)
              </label>
              <Input
                required
                type="number"
                min={1}
                value={seuilHeures}
                onChange={(e) => setSeuilHeures(e.target.value)}
              />
              <p className="mt-1 text-xs text-fg-dim">Défaut : 507 h (intermittence du spectacle).</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Durée de la fenêtre glissante (mois)
              </label>
              <Input
                required
                type="number"
                min={1}
                value={dureeFenetreMois}
                onChange={(e) => setDureeFenetreMois(e.target.value)}
              />
              <p className="mt-1 text-xs text-fg-dim">Défaut : 12 mois.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Journée type (heures)</label>
              <Input
                required
                type="number"
                min={0.5}
                step="0.5"
                value={journeeTypeHeures}
                onChange={(e) => setJourneeTypeHeures(e.target.value)}
              />
              <p className="mt-1 text-xs text-fg-dim">
                Sert à convertir des jours freelance en équivalent heures (répartition du dashboard).
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Heures par cachet</label>
              <Input
                required
                type="number"
                min={0.5}
                step="0.5"
                value={heuresParCachet}
                onChange={(e) => setHeuresParCachet(e.target.value)}
              />
              <p className="mt-1 text-xs text-fg-dim">
                Sert à convertir un nombre de cachets en heures d&apos;intermittence à la saisie d&apos;une mission.
              </p>
            </div>

            {erreur && (
              <p className="rounded-lg border border-accent-pink/30 bg-accent-pink/10 px-3 py-2 text-sm text-accent-pink">
                {erreur}
              </p>
            )}
            {succes && (
              <p className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-sm text-accent-blue-light">
                Paramètres enregistrés.
              </p>
            )}

            <Button type="submit" disabled={enregistrement}>
              <Save size={16} />
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
