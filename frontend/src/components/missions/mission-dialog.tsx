'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FileText, Paperclip, Unlink } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/ui/pill';
import { UploadDropzone } from '@/components/documents/upload-dropzone';
import { ThumbnailPopover } from '@/components/documents/thumbnail-popover';
import { DayPicker } from '@/components/missions/day-picker';
import { useThumbnailHover } from '@/lib/use-thumbnail-hover';
import { apiDownloadBlob, apiFetch, ApiError } from '@/lib/api';
import { AppDocument, CategorieDocument, Mission, ModeJours, StatutMission, TypeMission } from '@/lib/types';
import { STATUT_LABEL } from '@/lib/mission-format';
import { CATEGORIE_LABEL } from '@/lib/document-format';

const CATEGORIES_DOCUMENT: CategorieDocument[] = ['CONTRAT', 'ATTESTATION_EMPLOYEUR', 'DEVIS', 'FACTURE', 'AUTRE'];

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

/** Comparaison de chaînes "YYYY-MM-DD" : correcte chronologiquement pour ce format. */
function estDansLeFutur(dateISO: string): boolean {
  const aujourdHui = new Date().toISOString().slice(0, 10);
  return dateISO > aujourdHui;
}

/** Écart calendaire inclusif entre deux dates "YYYY-MM-DD". */
function joursCalendaires(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const t1 = new Date(`${debut}T00:00:00.000Z`).getTime();
  const t2 = new Date(`${fin}T00:00:00.000Z`).getTime();
  if (t2 < t1) return 0;
  return Math.round((t2 - t1) / 86_400_000) + 1;
}

/** Même écart, week-ends (samedi/dimanche) exclus. */
function joursOuvres(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const t1 = new Date(`${debut}T00:00:00.000Z`).getTime();
  const t2 = new Date(`${fin}T00:00:00.000Z`).getTime();
  if (t2 < t1) return 0;
  let compte = 0;
  for (let t = t1; t <= t2; t += 86_400_000) {
    const jour = new Date(t).getUTCDay(); // 0 = dimanche, 6 = samedi
    if (jour !== 0 && jour !== 6) compte++;
  }
  return compte;
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
  const [exclureWeekends, setExclureWeekends] = useState(true);
  const [modeJours, setModeJours] = useState<ModeJours>('PLAGE');
  const [joursTravailles, setJoursTravailles] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Documents attachés à cette mission (édition uniquement).
  const [documentsAttaches, setDocumentsAttaches] = useState<AppDocument[]>([]);
  // Tous les autres documents (dépôt global OU déjà liés à une autre mission) :
  // on peut réattacher un document depuis n'importe où, pas seulement le dépôt global.
  const [documentsDisponibles, setDocumentsDisponibles] = useState<AppDocument[]>([]);
  const [documentAAttacher, setDocumentAAttacher] = useState('');
  const [enCoursDocument, setEnCoursDocument] = useState(false);
  const [categorieUpload, setCategorieUpload] = useState<CategorieDocument>('AUTRE');
  const [enTeleversement, setEnTeleversement] = useState(false);
  const vignette = useThumbnailHover();
  const docSurvole = documentsAttaches.find((d) => d.id === vignette.survoleId);

  const chargerDocuments = useCallback(async () => {
    if (!mission) return;
    const tous = await apiFetch<AppDocument[]>('/documents');
    setDocumentsAttaches(tous.filter((d) => d.missionId === mission.id));
    setDocumentsDisponibles(tous.filter((d) => d.missionId !== mission.id));
  }, [mission]);

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
      setModeJours(mission.modeJours ?? 'PLAGE');
      setJoursTravailles(mission.joursTravailles ?? []);
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
      setModeJours('PLAGE');
      setJoursTravailles([]);
    }
    setErreur(null);
    setDocumentsAttaches([]);
    setDocumentsDisponibles([]);
    setDocumentAAttacher('');
  }, [open, mission, defaultDate]);

  useEffect(() => {
    if (open && mission) chargerDocuments();
  }, [open, mission, chargerDocuments]);

  async function televerserDocument(file: File) {
    if (!mission) return;
    setErreur(null);
    setEnTeleversement(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('categorie', categorieUpload);
      form.append('missionId', String(mission.id));
      await apiFetch('/documents', { method: 'POST', body: form });
      await chargerDocuments();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Envoi impossible.');
    } finally {
      setEnTeleversement(false);
    }
  }

  async function attacherDocument() {
    if (!mission || !documentAAttacher) return;
    setEnCoursDocument(true);
    try {
      await apiFetch(`/documents/${documentAAttacher}`, {
        method: 'PATCH',
        body: JSON.stringify({ missionId: mission.id }),
      });
      setDocumentAAttacher('');
      await chargerDocuments();
    } catch {
      setErreur("Impossible d'attacher ce document.");
    } finally {
      setEnCoursDocument(false);
    }
  }

  async function detacherDocument(doc: AppDocument) {
    setEnCoursDocument(true);
    try {
      await apiFetch(`/documents/${doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ missionId: null }),
      });
      await chargerDocuments();
    } catch {
      setErreur('Impossible de détacher ce document.');
    } finally {
      setEnCoursDocument(false);
    }
  }

  async function previsualiserDocument(doc: AppDocument) {
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

  // Mode jour par jour : dateDebut/dateFin et nbJours (freelance) ou nbCachets
  // (intermittence) suivent les jours cochés, jamais saisis à la main — même
  // dérivation que côté backend, affichée ici pour que l'utilisateur voie le
  // résultat en temps réel (champs désactivés).
  useEffect(() => {
    if (modeJours !== 'JOUR_PAR_JOUR') return;
    if (joursTravailles.length === 0) return;
    const tries = [...joursTravailles].sort();
    setDateDebut(tries[0]);
    setDateFin(tries[tries.length - 1]);
    if (type === 'FREELANCE') {
      setNbJours(String(tries.length));
    } else {
      setNbCachets(String(tries.length));
    }
  }, [type, modeJours, joursTravailles]);

  const dateFinFuture = dateFin !== '' && estDansLeFutur(dateFin);

  // Une mission ne peut pas être "Terminée" avec une date de fin future (backend
  // aussi imposé) : si l'utilisateur recule la date de fin dans le futur alors que
  // "Terminée" est sélectionné, on retombe sur "Confirmée" plutôt que de laisser un
  // état incohérent affiché.
  useEffect(() => {
    if (dateFinFuture && statut === 'TERMINEE') {
      setStatut('CONFIRMEE');
    }
  }, [dateFinFuture, statut]);

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
      payload.modeJours = modeJours;
      payload.joursTravailles = modeJours === 'JOUR_PAR_JOUR' ? joursTravailles : [];

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
                <option key={s} value={s} disabled={s === 'TERMINEE' && dateFinFuture}>
                  {STATUT_LABEL[s]}
                </option>
              ))}
            </Select>
            {dateFinFuture && (
              <p className="mt-1 text-xs text-fg-dim">Date de fin future : « Terminée » indisponible.</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Date de début</label>
            <Input
              required
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              disabled={modeJours === 'JOUR_PAR_JOUR'}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Date de fin</label>
            <Input
              required
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              disabled={modeJours === 'JOUR_PAR_JOUR'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Jours travaillés</label>
            <div className="flex gap-2">
              <Pill active={modeJours === 'PLAGE'} onClick={() => setModeJours('PLAGE')}>
                Plage de dates
              </Pill>
              <Pill active={modeJours === 'JOUR_PAR_JOUR'} onClick={() => setModeJours('JOUR_PAR_JOUR')}>
                Jour par jour
              </Pill>
            </div>
          </div>

          {type === 'INTERMITTENCE' ? (
            modeJours === 'PLAGE' ? (
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
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                  Sélectionner les jours travaillés{' '}
                  <span className="font-normal text-fg-dim">(un jour coché = un cachet)</span>
                </label>
                <DayPicker value={joursTravailles} onChange={setJoursTravailles} />
              </div>
            )
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">Montant HT (€)</label>
                  <Input required type="number" min={0} step="0.01" value={montantHT} onChange={(e) => setMontantHT(e.target.value)} />
                </div>

                {modeJours === 'PLAGE' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-fg-muted">Nombre de jours</label>
                    <Input required type="number" min={0} step="0.5" value={nbJours} onChange={(e) => setNbJours(e.target.value)} />
                  </div>
                )}
              </div>

              {modeJours === 'PLAGE' && dateDebut && dateFin && (
                <div>
                  <label className="flex items-center gap-2 text-xs text-fg-muted">
                    <input
                      type="checkbox"
                      checked={exclureWeekends}
                      onChange={(e) => setExclureWeekends(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-subtle accent-accent-blue"
                    />
                    Exclure les week-ends du décompte de jours
                  </label>
                  <p className="mt-1.5 text-xs text-fg-dim">
                    Écart calendaire : {joursCalendaires(dateDebut, dateFin)} jour
                    {joursCalendaires(dateDebut, dateFin) > 1 ? 's' : ''} (du {dateDebut} au {dateFin})
                    {exclureWeekends && ` — ${joursOuvres(dateDebut, dateFin)} jour${joursOuvres(dateDebut, dateFin) > 1 ? 's' : ''} hors week-ends`}
                    .
                  </p>
                  {nbJours !== '' &&
                    Number(nbJours) !== (exclureWeekends ? joursOuvres(dateDebut, dateFin) : joursCalendaires(dateDebut, dateFin)) && (
                      <p className="mt-1 rounded-lg bg-[var(--surface-1)] px-3 py-2 text-xs text-fg-muted">
                        Le nombre de jours facturés ({nbJours}) diffère de l&apos;écart{' '}
                        {exclureWeekends ? 'ouvré' : 'calendaire'} ci-dessus — c&apos;est normal si vous ne
                        travaillez pas tous les jours de la plage. La mission reste affichée sur toute la
                        plage de dates dans le calendrier.
                      </p>
                    )}
                </div>
              )}

              {modeJours === 'JOUR_PAR_JOUR' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                    Sélectionner les jours travaillés
                  </label>
                  <DayPicker value={joursTravailles} onChange={setJoursTravailles} />
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Note (facultatif)</label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {modeEdition && (
          <div className="rounded-lg border border-subtle p-3">
            <p className="mb-2 text-xs font-medium text-fg-muted">Documents attachés</p>
            {documentsAttaches.length === 0 ? (
              <p className="mb-3 text-xs text-fg-dim">Aucun document attaché pour l&apos;instant.</p>
            ) : (
              <ul className="mb-3 space-y-1.5">
                {documentsAttaches.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => previsualiserDocument(doc)}
                      onMouseEnter={() => vignette.survoler(doc)}
                      onMouseMove={vignette.bouger}
                      onMouseLeave={vignette.quitter}
                      className="truncate text-left text-fg hover:text-accent-blue-light hover:underline"
                      title={doc.nomFichier}
                    >
                      {doc.nomFichier}
                      <span className="ml-1.5 text-xs text-fg-dim">{CATEGORIE_LABEL[doc.categorie]}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => detacherDocument(doc)}
                      disabled={enCoursDocument}
                      title="Détacher de cette mission"
                      className="shrink-0 rounded-lg p-1.5 text-fg-dim transition-colors hover:bg-accent-pink/15 hover:text-accent-pink"
                    >
                      <Unlink size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {docSurvole && (
              <ThumbnailPopover
                position={vignette.position}
                chargement={vignette.chargement}
                url={vignette.url}
                nomFichier={docSurvole.nomFichier}
              />
            )}

            {documentsDisponibles.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <SearchableSelect
                  value={documentAAttacher}
                  onChange={setDocumentAAttacher}
                  placeholder="Attacher un document existant…"
                  options={documentsDisponibles.map((doc) => ({
                    value: String(doc.id),
                    label: doc.nomFichier,
                    hint: doc.mission ? `lié à « ${doc.mission.titre} »` : 'dépôt global',
                  }))}
                />
                <button
                  type="button"
                  onClick={attacherDocument}
                  disabled={!documentAAttacher || enCoursDocument}
                  title="Attacher"
                  className="shrink-0 rounded-lg bg-accent-blue/15 p-2 text-accent-blue-light transition-colors hover:bg-accent-blue/25 disabled:opacity-50"
                >
                  <Paperclip size={15} />
                </button>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Catégorie du nouveau document
              </label>
              <Select
                value={categorieUpload}
                onChange={(e) => setCategorieUpload(e.target.value as CategorieDocument)}
              >
                {CATEGORIES_DOCUMENT.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIE_LABEL[c]}
                  </option>
                ))}
              </Select>
              <div className="mt-2">
                <UploadDropzone onFileSelected={televerserDocument} disabled={enTeleversement} compact />
              </div>
            </div>
          </div>
        )}

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
