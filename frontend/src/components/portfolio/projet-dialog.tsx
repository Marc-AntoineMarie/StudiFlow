'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/ui/pill';
import { apiFetch, ApiError } from '@/lib/api';
import { Projet, TagProjet } from '@/lib/types';

interface ProjetDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  projet?: Projet | null;
}

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function ProjetDialog({ open, onClose, onSaved, projet }: ProjetDialogProps) {
  const modeEdition = Boolean(projet);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<TagProjet>('PRO');
  const [date, setDate] = useState('');
  const [lienVideo, setLienVideo] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (projet) {
      setTitre(projet.titre);
      setDescription(projet.description);
      setTag(projet.tag);
      setDate(toDateInput(projet.date));
      setLienVideo(projet.lienVideo);
    } else {
      setTitre('');
      setDescription('');
      setTag('PRO');
      setDate('');
      setLienVideo('');
    }
    setErreur(null);
  }, [open, projet]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const payload = { titre, description, tag, date, lienVideo };
      if (modeEdition && projet) {
        await apiFetch(`/projets/${projet.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/projets', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setEnCours(false);
    }
  }

  async function onDelete() {
    if (!projet) return;
    if (!window.confirm(`Supprimer le projet « ${projet.titre} » ?`)) return;
    setEnCours(true);
    try {
      await apiFetch(`/projets/${projet.id}`, { method: 'DELETE' });
      onSaved();
      onClose();
    } catch {
      setErreur('Suppression impossible.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={modeEdition ? 'Modifier le projet' : 'Ajouter un projet'}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Titre</label>
          <Input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Teaser festival documentaire" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Description</label>
          <Textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Tag</label>
            <div className="flex gap-2">
              <Pill active={tag === 'PRO'} onClick={() => setTag('PRO')}>
                Pro
              </Pill>
              <Pill active={tag === 'PERSO'} onClick={() => setTag('PERSO')}>
                Perso
              </Pill>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Date</label>
            <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Lien vidéo (YouTube ou Vimeo)</label>
          <Input
            required
            type="url"
            value={lienVideo}
            onChange={(e) => setLienVideo(e.target.value)}
            placeholder="https://youtu.be/..."
          />
        </div>

        {erreur && (
          <p className="rounded-lg border border-accent-pink/30 bg-accent-pink/10 px-3 py-2 text-sm text-accent-pink">
            {erreur}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {modeEdition ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={enCours}
              className="text-sm text-accent-pink hover:underline"
            >
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement…' : modeEdition ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
