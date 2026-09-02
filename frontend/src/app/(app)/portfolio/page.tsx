'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pill } from '@/components/ui/pill';
import { ProjetCard } from '@/components/portfolio/projet-card';
import { ProjetDialog } from '@/components/portfolio/projet-dialog';
import { LiensPanel } from '@/components/portfolio/liens-panel';
import { apiFetch } from '@/lib/api';
import { LienPortfolio, Projet, TagProjet } from '@/lib/types';

type Tri = 'recent' | 'ancien';

export default function PortfolioPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [tagActif, setTagActif] = useState<TagProjet | 'TOUS'>('TOUS');
  const [tri, setTri] = useState<Tri>('recent');
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [projetActif, setProjetActif] = useState<Projet | null>(null);

  // Liens de partage
  const [liens, setLiens] = useState<LienPortfolio[]>([]);
  const [modeSelection, setModeSelection] = useState(false);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [titreLien, setTitreLien] = useState('');
  const [creationEnCours, setCreationEnCours] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    const [donnees, liensDonnees] = await Promise.all([
      apiFetch<Projet[]>('/projets'),
      apiFetch<LienPortfolio[]>('/portfolio-liens'),
    ]);
    setProjets(donnees);
    setLiens(liensDonnees);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function toggleModeSelection() {
    setModeSelection((v) => !v);
    setSelection(new Set());
    setTitreLien('');
  }

  function toggleSelectionProjet(p: Projet) {
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(p.id)) suivant.delete(p.id);
      else suivant.add(p.id);
      return suivant;
    });
  }

  async function creerLien() {
    if (selection.size === 0) return;
    setCreationEnCours(true);
    try {
      await apiFetch('/portfolio-liens', {
        method: 'POST',
        body: JSON.stringify({ titre: titreLien || undefined, projetIds: [...selection] }),
      });
      toggleModeSelection();
      await charger();
    } finally {
      setCreationEnCours(false);
    }
  }

  async function supprimerLien(id: number) {
    if (!window.confirm('Supprimer ce lien ? Il ne sera plus consultable (le fichier déjà téléchargé, lui, reste valable).')) return;
    await apiFetch(`/portfolio-liens/${id}`, { method: 'DELETE' });
    await charger();
  }

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
        <div className="flex items-center gap-2">
          <Button variant={modeSelection ? 'primary' : 'ghost'} onClick={toggleModeSelection}>
            {modeSelection ? <X size={16} /> : <Link2 size={16} />}
            {modeSelection ? 'Annuler la sélection' : 'Créer un lien de partage'}
          </Button>
          <Button onClick={ouvrirCreation}>
            <Plus size={16} />
            Ajouter un projet
          </Button>
        </div>
      </div>

      {modeSelection && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-card border border-accent-blue/30 bg-accent-blue/5 p-4">
          <p className="text-sm text-fg-muted">
            {selection.size} projet{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''} —
            clique sur les cartes pour les choisir.
          </p>
          <div className="ml-auto flex flex-1 items-center gap-2 sm:flex-none">
            <Input
              placeholder="Nom du lien (facultatif, ex. « Client X »)"
              value={titreLien}
              onChange={(e) => setTitreLien(e.target.value)}
              className="sm:w-64"
            />
            <Button onClick={creerLien} disabled={selection.size === 0 || creationEnCours}>
              {creationEnCours ? 'Création…' : 'Créer le lien'}
            </Button>
          </div>
        </div>
      )}

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
            <ProjetCard
              key={p.id}
              projet={p}
              onEdit={ouvrirEdition}
              modeSelection={modeSelection}
              selectionne={selection.has(p.id)}
              onToggleSelection={toggleSelectionProjet}
            />
          ))}
        </div>
      )}

      {!modeSelection && <LiensPanel liens={liens} onDelete={supprimerLien} />}

      <ProjetDialog
        open={dialogOuvert}
        onClose={() => setDialogOuvert(false)}
        onSaved={charger}
        projet={projetActif}
      />
    </div>
  );
}
