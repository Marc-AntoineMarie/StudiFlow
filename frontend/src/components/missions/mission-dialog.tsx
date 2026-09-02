'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/ui/pill';
import { apiDownloadBlob, apiFetch, ApiError } from '@/lib/api';
import { Mission, StatutMission, TypeMission } from '@/lib/types';
import { STATUT_LABEL } from '@/lib/mission-format';

interface MissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** null/absent = création. Une mission = édition. */
  mission?: Mission | null;
  /** Date pré-remplie (ISO) quand on ouvre depuis une cellule du calendrier. */
  defaultDate?: string;
}

const STATUTS: StatutMission[] = ['PROPOSEE', 'CONFIRMEE', 'TERMINEE'];

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function MissionDialog({ open, onClose, onSaved, mission, defaultDate }: MissionDialogProps) {
  const modeEdition = Boolean(mission);

  const [titre, setTitre] = useState('');
  const [clientOuProduction, setClientOuProduction] = useState('');
  const [type, setType] = useState<TypeMission>('INTERMITTENCE');
  const [statut, setStatut] = useState<StatutMission>('PROPOSEE');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [note, setNote] = useState('');
  const [heures, setHeures] = useState('');
  const [nbCachets, setNbCachets] = useState('');
  const [montantHT, setMontantHT] = useState('');
  const [nbJours, setNbJours] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mission) {
      setTitre(mission.titre);
      setClientOuProduction(mission.clientOuProduction);
      setType(mission.type);
      setStatut(mission.statut);
      setDateDebut(toDateInput(mission.dateDebut));
      setDateFin(toDateInput(mission.dateFin));
      setNote(mission.note ?? '');
      setHeures(mission.heures?.toString() ?? '');
      setNbCachets(mission.nbCachets?.toString() ?? '');
      setMontantHT(mission.montantHT?.toString() ?? '');
      setNbJours(mission.nbJours?.toString() ?? '');
    } else {
      setTitre('');
      setClientOuProduction('');
      setType('INTERMITTENCE');
      setStatut('PROPOSEE');
      setDateDebut(defaultDate ?? '');
      setDateFin(defaultDate ?? '');
      setNote('');
      setHeures('');
      setNbCachets('');
      setMontantHT('');
      setNbJours('');
    }
    setErreur(null);
  }, [open, mission, defaultDate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const payload: Record<string, unknown> = {
        titre,
        clientOuProduction,
        type,
        statut,
        dateDebut,
        dateFin,
        note: note || undefined,
      };
      if (type === 'INTERMITTENCE') {
        if (nbCachets) payload.nbCachets = Number(nbCachets);
        else payload.heures = Number(heures);
      } else {
        payload.montantHT = Number(montantHT);
        payload.nbJours = Number(nbJours);
      }

      if (modeEdition && mission) {
        await apiFetch(`/missions/${mission.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/missions', { method: 'POST', body: JSON.stringify(payload) });
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
    if (!mission) return;
    if (!window.confirm(`Supprimer la mission « ${mission.titre} » ?`)) return;
    setEnCours(true);
    try {
      await apiFetch(`/missions/${mission.id}`, { method: 'DELETE' });
      onSaved();
      onClose();
    } catch {
      setErreur('Suppression impossible.');
    } finally {
      setEnCours(false);
    }
  }

  async function onTelechargerPdf() {
    if (!mission) return;
    try {
      const blob = await apiDownloadBlob(`/missions/${mission.id}/recapitulatif.pdf`);
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `mission-${mission.id}-recapitulatif.pdf`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreur('Génération du PDF impossible.');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={modeEdition ? 'Modifier la mission' : 'Nouvelle mission'}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Titre</label>
            <Input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Montage teaser festival" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Client / production</label>
            <Input required value={clientOuProduction} onChange={(e) => setClientOuProduction(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Type</label>
          <div className="flex gap-2">
            <Pill active={type === 'INTERMITTENCE'} onClick={() => setType('INTERMITTENCE')}>
              Intermittence
            </Pill>
            <Pill active={type === 'FREELANCE'} onClick={() => setType('FREELANCE')}>
              Freelance
            </Pill>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Statut</label>
            <Select value={statut} onChange={(e) => setStatut(e.target.value as StatutMission)}>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {STATUT_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Date de début</label>
            <Input required type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Date de fin</label>
            <Input required type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          </div>
        </div>

        {type === 'INTERMITTENCE' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Heures</label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={heures}
                onChange={(e) => setHeures(e.target.value)}
                disabled={Boolean(nbCachets)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">ou nombre de cachets</label>
              <Input type="number" min={0} step="0.5" value={nbCachets} onChange={(e) => setNbCachets(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Montant HT (€)</label>
              <Input required type="number" min={0} step="0.01" value={montantHT} onChange={(e) => setMontantHT(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Nombre de jours</label>
              <Input required type="number" min={0} step="0.5" value={nbJours} onChange={(e) => setNbJours(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Note (facultatif)</label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {erreur && (
          <p className="rounded-lg border border-accent-pink/30 bg-accent-pink/10 px-3 py-2 text-sm text-accent-pink">
            {erreur}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {modeEdition ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onDelete}
                disabled={enCours}
                className="text-sm text-accent-pink hover:underline"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={onTelechargerPdf}
                className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg hover:underline"
              >
                <FileText size={14} />
                Récapitulatif PDF
              </button>
            </div>
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
