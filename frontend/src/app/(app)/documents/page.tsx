'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/documents/upload-dropzone';
import { DocumentsTable } from '@/components/documents/documents-table';
import { apiDownloadBlob, apiFetch, ApiError } from '@/lib/api';
import { AppDocument, CategorieDocument, Mission } from '@/lib/types';
import { CATEGORIE_LABEL } from '@/lib/document-format';

const CATEGORIES: CategorieDocument[] = ['CONTRAT', 'ATTESTATION_EMPLOYEUR', 'DEVIS', 'FACTURE', 'AUTRE'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chargement, setChargement] = useState(true);

  // Dépôt d'un nouveau document
  const [categorieUpload, setCategorieUpload] = useState<CategorieDocument>('CONTRAT');
  const [missionUpload, setMissionUpload] = useState(''); // '' = dépôt global
  const [enTeleversement, setEnTeleversement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Retrouver un document existant
  const [categoriesActives, setCategoriesActives] = useState<Set<CategorieDocument>>(new Set());
  const [missionFiltre, setMissionFiltre] = useState(''); // '' = toutes, 'none' = dépôt global
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    const [docs, mis] = await Promise.all([
      apiFetch<AppDocument[]>('/documents'),
      apiFetch<Mission[]>('/missions'),
    ]);
    setDocuments(docs);
    setMissions(mis);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const documentsFiltres = useMemo(() => {
    return documents.filter((d) => {
      if (categoriesActives.size > 0 && !categoriesActives.has(d.categorie)) return false;
      if (missionFiltre === 'none' && d.missionId !== null) return false;
      if (missionFiltre && missionFiltre !== 'none' && d.missionId !== Number(missionFiltre)) return false;
      if (recherche.trim()) {
        const q = recherche.trim().toLowerCase();
        const cible = `${d.nomFichier} ${d.mission?.titre ?? ''} ${CATEGORIE_LABEL[d.categorie]}`.toLowerCase();
        if (!cible.includes(q)) return false;
      }
      return true;
    });
  }, [documents, categoriesActives, missionFiltre, recherche]);

  function toggleCategorie(c: CategorieDocument) {
    const suivant = new Set(categoriesActives);
    if (suivant.has(c)) suivant.delete(c);
    else suivant.add(c);
    setCategoriesActives(suivant);
  }

  async function onFileSelected(file: File) {
    setErreur(null);
    setEnTeleversement(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('categorie', categorieUpload);
      if (missionUpload) form.append('missionId', missionUpload);
      await apiFetch('/documents', { method: 'POST', body: form });
      await charger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Envoi impossible.');
    } finally {
      setEnTeleversement(false);
    }
  }

  async function onDownload(doc: AppDocument) {
    try {
      const blob = await apiDownloadBlob(`/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = doc.nomFichier;
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreur('Téléchargement impossible.');
    }
  }

  async function onPreview(doc: AppDocument) {
    // Ouvrir la fenêtre AVANT le fetch (synchrone, dans le geste utilisateur) :
    // sinon les navigateurs bloquent l'ouverture d'onglet une fois l'await passé.
    const fenetre = window.open('', '_blank');
    try {
      const blob = await apiDownloadBlob(`/documents/${doc.id}/download`);
      const url = URL.createObjectURL(blob);
      if (fenetre) fenetre.location.href = url;
      else window.open(url, '_blank');
    } catch {
      fenetre?.close();
      setErreur('Aperçu impossible.');
    }
  }

  async function onLierMission(doc: AppDocument, missionId: number | null) {
    try {
      await apiFetch(`/documents/${doc.id}`, { method: 'PATCH', body: JSON.stringify({ missionId }) });
      await charger();
    } catch {
      setErreur('Impossible de changer la mission liée.');
    }
  }

  async function onDelete(doc: AppDocument) {
    if (!window.confirm(`Supprimer « ${doc.nomFichier} » ?`)) return;
    try {
      await apiFetch(`/documents/${doc.id}`, { method: 'DELETE' });
      await charger();
    } catch {
      setErreur('Suppression impossible.');
    }
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-fg">Documents</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Déposez et rattachez rapidement les documents à une mission ou conservez-les en dépôt global.
      </p>

      <Card className="mt-8 grid gap-6 p-6 lg:grid-cols-[1fr_260px]">
        <UploadDropzone onFileSelected={onFileSelected} disabled={enTeleversement} />
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Catégorie</label>
            <Select value={categorieUpload} onChange={(e) => setCategorieUpload(e.target.value as CategorieDocument)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIE_LABEL[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Mission liée</label>
            <SearchableSelect
              value={missionUpload}
              onChange={setMissionUpload}
              placeholder="Dépôt global"
              options={[
                { value: '', label: 'Dépôt global' },
                ...missions.map((m) => ({ value: String(m.id), label: m.titre })),
              ]}
            />
          </div>
        </div>
      </Card>

      {erreur && <p className="mt-4 text-sm text-accent-pink">{erreur}</p>}

      <Card className="mt-6 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-dim">Retrouver un document</p>
          <Button
            variant="ghost"
            onClick={() => {
              setCategoriesActives(new Set());
              setMissionFiltre('');
              setRecherche('');
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser les filtres
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Catégorie</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Pill key={c} active={categoriesActives.has(c)} onClick={() => toggleCategorie(c)}>
                  {CATEGORIE_LABEL[c]}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Mission</p>
            <SearchableSelect
              value={missionFiltre}
              onChange={setMissionFiltre}
              placeholder="Toutes les missions"
              options={[
                { value: '', label: 'Toutes les missions' },
                { value: 'none', label: 'Dépôt global uniquement' },
                ...missions.map((m) => ({ value: String(m.id), label: m.titre })),
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-dim">Recherche</p>
            <Input
              icon={<Search size={16} />}
              placeholder="Nom, mission ou catégorie"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="mt-4">
        {chargement ? (
          <p className="text-fg-muted">Chargement…</p>
        ) : (
          <DocumentsTable
            documents={documentsFiltres}
            missions={missions}
            onDownload={onDownload}
            onDelete={onDelete}
            onPreview={onPreview}
            onLierMission={onLierMission}
          />
        )}
      </div>
    </div>
  );
}
