'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pill } from '@/components/ui/pill';
import { ProjetCard } from '@/components/portfolio/projet-card';
import { ProjetDialog } from '@/components/portfolio/projet-dialog';
import { apiFetch } from '@/lib/api';
import { Projet, TagProjet } from '@/lib/types';

type Tri = 'recent' | 'ancien';

export default function PortfolioPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [tagActif, setTagActif] = useState<TagProjet | 'TOUS'>('TOUS');
  const [tri, setTri] = useState<Tri>('recent');
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [projetActif, setProjetActif] = useState<Projet | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    const donnees = await apiFetch<Projet[]>('/projets');
    setProjets(donnees);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const projetsFiltres = useMemo(() => {
    let resultat = projets;
    if (tagActif !== 'TOUS') resultat = resultat.filter((p) => p.tag === tagActif);
    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      resultat = resultat.filter((p) => `${p.titre} ${p.description}`.toLowerCase().includes(q));
    }
    resultat = [...resultat].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return tri === 'recent' ? -diff : diff;
    });
    return resultat;
  }, [projets, tagActif, recherche, tri]);

  function ouvrirCreation() {
    setProjetActif(null);
    setDialogOuvert(true);
  }

  function ouvrirEdition(p: Projet) {
    setProjetActif(p);
    setDialogOuvert(true);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-fg">Portfolio</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Une liste claire de projets pro et perso avec aperçu vidéo intégré, sans quitter l&apos;outil.
          </p>
        </div>
        <Button onClick={ouvrirCreation}>
          <Plus size={16} />
          Ajouter un projet
        </Button>
      </div>

      <div className="mb-6 grid gap-4 rounded-card border border-subtle bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <Input
          icon={<Search size={16} />}
          placeholder="Rechercher titre ou description"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Pill active={tagActif === 'TOUS'} onClick={() => setTagActif('TOUS')}>
            Tous
          </Pill>
          <Pill active={tagActif === 'PRO'} onClick={() => setTagActif('PRO')}>
            Pro
          </Pill>
          <Pill active={tagActif === 'PERSO'} onClick={() => setTagActif('PERSO')}>
            Perso
          </Pill>
        </div>
        <Select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className="sm:w-40">
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
        </Select>
      </div>

      {chargement && <p className="text-fg-muted">Chargement…</p>}

      {!chargement && projetsFiltres.length === 0 && (
        <p className="py-10 text-center text-sm text-fg-muted">Aucun projet ne correspond aux filtres.</p>
      )}

      {!chargement && projetsFiltres.length > 0 && (
        <div className="space-y-4">
          {projetsFiltres.map((p) => (
            <ProjetCard key={p.id} projet={p} onEdit={ouvrirEdition} />
          ))}
        </div>
      )}

      <ProjetDialog
        open={dialogOuvert}
        onClose={() => setDialogOuvert(false)}
        onSaved={charger}
        projet={projetActif}
      />
    </div>
  );
}
