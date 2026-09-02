'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/ui/pill';
import { TagInput } from '@/components/ui/tag-input';
import { UploadDropzone } from '@/components/documents/upload-dropzone';
import { apiFetch, ApiError } from '@/lib/api';
import { Projet, TagProjet } from '@/lib/types';
import { urlVideoHebergee } from '@/lib/video-hebergee';
import { formatTaille } from '@/lib/document-format';

interface ProjetDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  projet?: Projet | null;
}

type SourceVideo = 'externe' | 'hebergee';

interface VideoHebergeeInfo {
  stockageNom: string;
  nomFichier: string;
  mimeType: string;
  tailleOctets: number;
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
  const [boiteProduction, setBoiteProduction] = useState('');
  const [clients, setClients] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [sourceVideo, setSourceVideo] = useState<SourceVideo>('externe');
  const [videoActuelle, setVideoActuelle] = useState<VideoHebergeeInfo | null>(null);
  const [enTeleversement, setEnTeleversement] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (projet) {
      setTitre(projet.titre);
      setDescription(projet.description);
      setTag(projet.tag);
      setDate(toDateInput(projet.date));
      setLienVideo(projet.lienVideo ?? '');
      setBoiteProduction(projet.boiteProduction ?? '');
      setClients(projet.clients ?? []);
      if (projet.videoStockageNom && projet.videoNomFichier && projet.videoMimeType && projet.videoTailleOctets != null) {
        setSourceVideo('hebergee');
        setVideoActuelle({
          stockageNom: projet.videoStockageNom,
          nomFichier: projet.videoNomFichier,
          mimeType: projet.videoMimeType,
          tailleOctets: projet.videoTailleOctets,
        });
      } else {
        setSourceVideo('externe');
        setVideoActuelle(null);
      }
    } else {
      setTitre('');
      setDescription('');
      setTag('PRO');
      setDate('');
      setLienVideo('');
      setBoiteProduction('');
      setClients([]);
      setSourceVideo('externe');
      setVideoActuelle(null);
    }
    setErreur(null);
  }, [open, projet]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const payload = {
        titre,
        description,
        tag,
        date,
        // Vide si une vidéo hébergée est active : le champ est alors juste masqué,
        // pas question d'écraser la vidéo hébergée avec une chaîne vide.
        lienVideo: sourceVideo === 'externe' ? lienVideo : '',
        // Chaîne vide envoyée explicitement (pas `undefined`) : permet d'effacer
        // une valeur existante en édition, pas seulement d'en ajouter une.
        boiteProduction: boiteProduction.trim(),
        clients,
      };
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

  async function televerserVideo(file: File) {
    if (!projet) return;
    setErreur(null);
    setEnTeleversement(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const resultat = await apiFetch<Projet>(`/projets/${projet.id}/video`, { method: 'POST', body: form });
      setVideoActuelle({
        stockageNom: resultat.videoStockageNom!,
        nomFichier: resultat.videoNomFichier!,
        mimeType: resultat.videoMimeType!,
        tailleOctets: resultat.videoTailleOctets!,
      });
      setLienVideo('');
      onSaved();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Envoi de la vidéo impossible.');
    } finally {
      setEnTeleversement(false);
    }
  }

  async function supprimerVideoHebergee() {
    if (!projet) return;
    if (!window.confirm('Supprimer la vidéo hébergée ?')) return;
    try {
      await apiFetch(`/projets/${projet.id}/video`, { method: 'DELETE' });
      setVideoActuelle(null);
      onSaved();
    } catch {
      setErreur('Suppression de la vidéo impossible.');
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
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Vidéo</label>
          <div className="mb-2 flex gap-2">
            <Pill active={sourceVideo === 'externe'} onClick={() => setSourceVideo('externe')}>
              Lien externe
            </Pill>
            <Pill active={sourceVideo === 'hebergee'} onClick={() => setSourceVideo('hebergee')}>
              Vidéo hébergée
            </Pill>
          </div>

          {sourceVideo === 'externe' ? (
            <Input
              type="url"
              value={lienVideo}
              onChange={(e) => setLienVideo(e.target.value)}
              placeholder="https://youtu.be/..."
            />
          ) : !modeEdition ? (
            <p className="rounded-lg bg-[var(--surface-1)] px-3 py-2 text-xs text-fg-muted">
              Enregistrez d&apos;abord le projet — vous pourrez ensuite y attacher une vidéo hébergée.
            </p>
          ) : videoActuelle ? (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-subtle bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={urlVideoHebergee(projet!.id) ?? undefined} controls className="aspect-video w-full" />
              </div>
              <div className="flex items-center justify-between text-xs text-fg-muted">
                <span className="truncate">
                  {videoActuelle.nomFichier} · {formatTaille(videoActuelle.tailleOctets)}
                </span>
                <button
                  type="button"
                  onClick={supprimerVideoHebergee}
                  className="flex shrink-0 items-center gap-1 text-accent-pink hover:underline"
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <UploadDropzone
              onFileSelected={televerserVideo}
              disabled={enTeleversement}
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              compact
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Boîte de production <span className="font-normal text-fg-dim">(facultatif)</span>
          </label>
          <Input
            value={boiteProduction}
            onChange={(e) => setBoiteProduction(e.target.value)}
            placeholder="Studio Rivage"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">
            Client(s) <span className="font-normal text-fg-dim">(facultatif)</span>
          </label>
          <TagInput value={clients} onChange={setClients} placeholder="Nom du client, puis Entrée" />
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
