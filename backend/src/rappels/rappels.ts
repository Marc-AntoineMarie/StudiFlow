/**
 * Rappels d'échéance (module différenciant, en complément de l'export ICS/CSV) :
 * fin de contrat proche, document manquant sur une mission terminée, seuil
 * d'heures qui approche. Fonction pure, testée seule.
 */
export type TypeRappel = 'FIN_CONTRAT' | 'DOCUMENT_MANQUANT' | 'SEUIL_HEURES';

export interface MissionRappel {
  id: number;
  titre: string;
  statut: 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';
  dateFin: Date;
  nbDocuments: number;
}

export interface JaugeRappel {
  heuresCumulees: number;
  seuil: number;
  pourcentage: number;
}

export interface Rappel {
  type: TypeRappel;
  missionId: number | null;
  titre: string;
  dateFin: Date | null;
  detail: string;
}

/** Fenêtre de vigilance avant la fin d'un contrat confirmé. */
const FENETRE_FIN_CONTRAT_JOURS = 14;
/** Déclenche l'alerte à partir de 90 % du seuil de référence. */
const SEUIL_ALERTE_POURCENTAGE = 0.9;

export function construireRappels(
  missions: MissionRappel[],
  jauge: JaugeRappel,
  dateRef: Date,
): Rappel[] {
  const rappels: Rappel[] = [];
  const limite = new Date(
    Date.UTC(dateRef.getUTCFullYear(), dateRef.getUTCMonth(), dateRef.getUTCDate() + FENETRE_FIN_CONTRAT_JOURS),
  );

  for (const m of missions) {
    if (m.statut === 'CONFIRMEE' && m.dateFin.getTime() >= dateRef.getTime() && m.dateFin.getTime() <= limite.getTime()) {
      rappels.push({
        type: 'FIN_CONTRAT',
        missionId: m.id,
        titre: m.titre,
        dateFin: m.dateFin,
        detail: 'Contrat confirmé arrivant à échéance sous 14 jours.',
      });
    }

    if (m.statut === 'TERMINEE' && m.nbDocuments === 0) {
      rappels.push({
        type: 'DOCUMENT_MANQUANT',
        missionId: m.id,
        titre: m.titre,
        dateFin: m.dateFin,
        detail: 'Mission terminée sans aucun document rattaché.',
      });
    }
  }

  if (jauge.seuil > 0 && jauge.pourcentage >= SEUIL_ALERTE_POURCENTAGE) {
    rappels.push({
      type: 'SEUIL_HEURES',
      missionId: null,
      titre: "Seuil d'intermittence proche",
      dateFin: null,
      detail: `${Math.round(jauge.heuresCumulees)} h sur ${jauge.seuil} h (${Math.round(jauge.pourcentage * 100)} %).`,
    });
  }

  return rappels;
}
