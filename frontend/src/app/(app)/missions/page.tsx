'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  List,
  Milestone,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/pill';
import { MonthCalendar } from '@/components/missions/month-calendar';
import { MissionsList } from '@/components/missions/missions-list';
import { TimelineView } from '@/components/missions/timeline-view';
import { MissionDialog } from '@/components/missions/mission-dialog';
import { apiDownloadBlob, apiFetch } from '@/lib/api';
import { Mission, StatutMission, TypeMission } from '@/lib/types';
import { STATUT_LABEL, TYPE_LABEL } from '@/lib/mission-format';

const TYPES: TypeMission[] = ['INTERMITTENCE', 'FREELANCE'];
const STATUTS: StatutMission[] = ['PROPOSEE', 'CONFIRMEE', 'TERMINEE'];

function debutMoisCourant() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<p className="text-fg-muted">Chargement…</p>}>
      <MissionsPageInterieur />
    </Suspense>
  );
}

function MissionsPageInterieur() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vue, setVue] = useState<'mois' | 'liste' | 'timeline'>('mois');
  const [monthCursor, setMonthCursor] = useState<Date>(debutMoisCourant);
  const [anneeTimeline, setAnneeTimeline] = useState<number>(() => new Date().getFullYear());
  const [typesActifs, setTypesActifs] = useState<Set<TypeMission>>(new Set());
  const [statutsActifs, setStatutsActifs] = useState<Set<StatutMission>>(new Set());
  const [recherche, setRecherche] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chargement, setChargement] = useState(true);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [missionActive, setMissionActive] = useState<Mission | null>(null);
  const [dateParDefaut, setDateParDefaut] = useState<string | undefined>();

  const charger = useCallback(async () => {
    setChargement(true);
    const donnees = await apiFetch<Mission[]>('/missions');
    setMissions(donnees);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Lien profond (ex. depuis un document ou un rappel) : /missions?id=123 ouvre
  // directement l'édition de cette mission, puis nettoie l'URL.
  useEffect(() => {
    if (chargement) return;
    const id = searchParams.get('id');
    if (!id) return;
    const cible = missions.find((m) => m.id === Number(id));
    if (cible) ouvrirEdition(cible);
    router.replace('/missions');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargement, missions, searchParams]);

  const missionsFiltrees = useMemo(() => {
    return missions.filter((m) => {
      if (typesActifs.size > 0 && !typesActifs.has(m.type)) return false;
      if (statutsActifs.size > 0 && !statutsActifs.has(m.statut)) return false;
      if (recherche.trim()) {
        const q = recherche.trim().toLowerCase();
        const cible = `${m.titre} ${m.clientOuProduction} ${m.note ?? ''}`.toLowerCase();
        if (!cible.includes(q)) return false;
      }
      return true;
    });
  }, [missions, typesActifs, statutsActifs, recherche]);

  // Timeline : une seule année à la fois (regroupée par mois de date de début),
  // année courante par défaut, navigable.
  const missionsTimeline = useMemo(() => {
    return missionsFiltrees.filter((m) => new Date(m.dateDebut).getUTCFullYear() === anneeTimeline);
  }, [missionsFiltrees, anneeTimeline]);

  function toggle<T>(ensemble: Set<T>, setter: (s: Set<T>) => void, valeur: T) {
    const suivant = new Set(ensemble);
    if (suivant.has(valeur)) suivant.delete(valeur);
    else suivant.add(valeur);
    setter(suivant);
  }

  function ouvrirCreation(dateIso?: string) {
    setMissionActive(null);
    setDateParDefaut(dateIso);
    setDialogOuvert(true);
  }

  function ouvrirEdition(m: Mission) {
    setMissionActive(m);
    setDateParDefaut(undefined);
    setDialogOuvert(true);
  }

  function changerMois(delta: number) {
    setMonthCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + delta, 1)));
  }

  async function exporter(chemin: string, nomFichier: string) {
    try {
      const blob = await apiDownloadBlob(chemin);
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = nomFichier;
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export non bloquant pour le reste de la page ; pas de message d'erreur
      // envahissant pour un clic secondaire.
    }
  }

  const labelMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(monthCursor);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-fg">Missions</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {missionsFiltrees.length} mission{missionsFiltrees.length > 1 ? 's' : ''} — lecture rapide par régime
            et statut.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => exporter('/export/calendar.ics', 'cadre-missions.ics')}>
            <CalendarDays size={16} />
            Export .ics
          </Button>
          <Button variant="ghost" onClick={() => exporter('/export/missions.csv', 'cadre-missions.csv')}>
            <FileSpreadsheet size={16} />
            Export .csv
          </Button>
          <Button onClick={() => ouvrirCreation()}>
            <Plus size={16} />
            Nouvelle mission
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-card border border-subtle bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant={vue === 'mois' ? 'primary' : 'ghost'} onClick={() => setVue('mois')}>
              <Calendar size={16} />
              Mois
            </Button>
            <Button variant={vue === 'liste' ? 'primary' : 'ghost'} onClick={() => setVue('liste')}>
              <List size={16} />
              Liste
            </Button>
            <Button variant={vue === 'timeline' ? 'primary' : 'ghost'} onClick={() => setVue('timeline')}>
              <Milestone size={16} />
              Timeline
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setTypesActifs(new Set());
              setStatutsActifs(new Set());
              setRecherche('');
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser les filtres
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Pill key={t} active={typesActifs.has(t)} onClick={() => toggle(typesActifs, setTypesActifs, t)}>
                  {TYPE_LABEL[t]}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((s) => (
                <Pill
                  key={s}
                  active={statutsActifs.has(s)}
                  onClick={() => toggle(statutsActifs, setStatutsActifs, s)}
                >
                  {STATUT_LABEL[s]}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Recherche</p>
            <Input
              icon={<Search size={16} />}
              placeholder="Client, production ou note"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>
      </div>

      {vue === 'mois' && (
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => changerMois(-1)}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="w-40 text-center font-heading text-sm font-medium capitalize text-fg">{labelMois}</p>
          <button
            type="button"
            onClick={() => changerMois(1)}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {vue === 'timeline' && (
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setAnneeTimeline((a) => a - 1)}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="w-40 text-center font-heading text-sm font-medium text-fg">{anneeTimeline}</p>
          <button
            type="button"
            onClick={() => setAnneeTimeline((a) => a + 1)}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-[var(--surface-1)] hover:text-fg"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {chargement && <p className="text-fg-muted">Chargement…</p>}

      {!chargement && vue === 'mois' && (
        <MonthCalendar
          monthCursor={monthCursor}
          missions={missionsFiltrees}
          onAddDay={ouvrirCreation}
          onSelectMission={ouvrirEdition}
        />
      )}
      {!chargement && vue === 'liste' && <MissionsList missions={missionsFiltrees} onSelect={ouvrirEdition} />}
      {!chargement && vue === 'timeline' && (
        <TimelineView missions={missionsTimeline} onSelect={ouvrirEdition} />
      )}

      <MissionDialog
        open={dialogOuvert}
        onClose={() => setDialogOuvert(false)}
        onSaved={charger}
        mission={missionActive}
        defaultDate={dateParDefaut}
      />
    </div>
  );
}
