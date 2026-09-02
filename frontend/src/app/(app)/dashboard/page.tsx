'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, PieChart as PieChartIcon, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { GaugeHeures } from '@/components/dashboard/gauge-heures';
import { CaAreaChart } from '@/components/dashboard/ca-area-chart';
import { RepartitionDonut } from '@/components/dashboard/repartition-donut';
import {
  RepartitionClients,
  type RepartitionClients as RepartitionClientsData,
} from '@/components/dashboard/repartition-clients';
import { RappelsPanel } from '@/components/dashboard/rappels-panel';
import { apiFetch, ApiError } from '@/lib/api';
import { clearToken } from '@/lib/auth';
import { Rappel } from '@/lib/types';

interface Indicateurs {
  jauge: { heuresCumulees: number; seuil: number; pourcentage: number; restant: number };
  caParMois: { mois: string; montantHT: number }[];
  caTotal: number;
  repartition: { partIntermittence: number; partFreelance: number };
  repartitionClients: RepartitionClientsData;
}

/**
 * Guard (redirection si non connecté) et navigation sont gérés par
 * app/(app)/layout.tsx — cette page ne s'occupe que de son contenu.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Indicateurs | null>(null);
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Indicateurs>('/dashboard')
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        setErreur('Impossible de charger le tableau de bord.');
      });
    apiFetch<Rappel[]>('/rappels').then(setRappels).catch(() => setRappels([]));
  }, [router]);

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-dim">
        <Sparkles size={13} className="text-accent-purple" />
        Tableau de bord
      </p>
      <h1 className="mb-8 font-heading text-3xl font-semibold text-fg">Vue d&apos;activité</h1>

      {erreur && <p className="text-accent-pink">{erreur}</p>}
      {!data && !erreur && <p className="text-fg-muted">Chargement…</p>}

      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
                <Clock size={14} className="text-accent-blue" />
                Intermittence
              </span>
              <span className="rounded-full bg-[var(--surface-1)] px-2.5 py-1 text-[11px] text-fg-muted">
                {data.caParMois.length} mois glissants
              </span>
            </div>
            <GaugeHeures
              heures={data.jauge.heuresCumulees}
              seuil={data.jauge.seuil}
              pourcentage={data.jauge.pourcentage}
              restant={data.jauge.restant}
            />
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
                <TrendingUp size={14} className="text-accent-gold" />
                CA freelance
              </span>
              <span className="rounded-full bg-[var(--surface-1)] px-2.5 py-1 text-[11px] text-fg-muted">
                {data.caParMois.length} derniers mois
              </span>
            </div>
            <p className="font-heading text-3xl font-semibold text-fg">
              {data.caTotal.toLocaleString('fr-FR')} €
            </p>
            <div className="mt-2">
              <CaAreaChart data={data.caParMois} />
            </div>
          </Card>

          <Card className="p-6">
            <span className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
              <PieChartIcon size={14} className="text-accent-purple" />
              Répartition
            </span>
            <div className="flex h-full items-center">
              <RepartitionDonut
                partIntermittence={data.repartition.partIntermittence}
                partFreelance={data.repartition.partFreelance}
              />
            </div>
          </Card>
        </div>
      )}

      {data && (
        <div className="mt-4 grid gap-4">
          <Card className="p-6">
            <span className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
              <Users size={14} className="text-accent-purple" />
              Répartition par client
            </span>
            <RepartitionClients data={data.repartitionClients} />
          </Card>
          <RappelsPanel rappels={rappels} />
        </div>
      )}
    </div>
  );
}
