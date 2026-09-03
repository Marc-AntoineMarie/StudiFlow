/**
 * Règles de cohérence d'une mission (indépendantes de Prisma/Nest, testables seules).
 * Ne couvre pas le calcul des 12 mois glissants — voir src/calc/rolling-window.ts.
 */
import { BadRequestException } from '@nestjs/common';

export type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
export type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';
export type ModeJours = 'PLAGE' | 'JOUR_PAR_JOUR';

export interface DonneesMission {
  type: TypeMission;
  statut: StatutMission;
  dateDebut: Date;
  dateFin: Date;
  heures?: number | null;
  nbCachets?: number | null;
  montantHT?: number | null;
  nbJours?: number | null;
  /** Freelance uniquement. JOUR_PAR_JOUR dérive dateDebut/dateFin/nbJours de joursTravailles. */
  modeJours?: ModeJours;
  /** "YYYY-MM-DD", pertinent seulement si modeJours = JOUR_PAR_JOUR. */
  joursTravailles?: string[];
}

/**
 * Valide une mission et normalise ses champs selon son type :
 * - INTERMITTENCE : heures ou nbCachets requis ; nbCachets prime et est converti en
 *   heures via heuresParCachet ; montantHT/nbJours forcés à null. modeJours forcé à
 *   PLAGE (la sélection jour par jour n'a de sens qu'en freelance).
 * - FREELANCE, mode PLAGE (défaut) : comportement historique inchangé — dateDebut,
 *   dateFin, montantHT et nbJours saisis directement.
 * - FREELANCE, mode JOUR_PAR_JOUR : dateDebut, dateFin et nbJours sont dérivés de
 *   joursTravailles (min, max, compte) — jamais saisis à la main, donc jamais en
 *   décalage avec les jours réellement cochés (résout la confusion week-ends
 *   historique, cf. journal de bord 2026-09-03).
 * - Une mission ne peut pas être marquée Terminée si sa date de fin est dans le
 *   futur (incohérence détectée en test suite au retour utilisateur du 2026-09-02 :
 *   une mission "terminée" datée dans le futur n'entre jamais dans le calcul des
 *   12 mois glissants, ce qui est correct mais silencieusement déroutant).
 *
 * Lève BadRequestException sur toute incohérence. `dateRef` est injectée (jamais
 * lue en interne) pour rester testable de façon déterministe.
 */
export function validerEtNormaliserMission(
  data: DonneesMission,
  heuresParCachet: number,
  dateRef: Date = new Date(),
): DonneesMission {
  const modeJourParJour = data.type === 'FREELANCE' && data.modeJours === 'JOUR_PAR_JOUR';

  if (modeJourParJour) {
    const jours = data.joursTravailles ?? [];
    if (jours.length === 0) {
      throw new BadRequestException('Sélectionnez au moins un jour travaillé.');
    }
    const tries = [...jours].sort();
    data = {
      ...data,
      dateDebut: new Date(`${tries[0]}T00:00:00.000Z`),
      dateFin: new Date(`${tries[tries.length - 1]}T00:00:00.000Z`),
      nbJours: jours.length,
      modeJours: 'JOUR_PAR_JOUR',
      joursTravailles: tries,
    };
  } else {
    // PLAGE (freelance) ou intermittence : pas de sélection jour par jour.
    data = { ...data, modeJours: 'PLAGE', joursTravailles: [] };
  }

  if (data.dateFin.getTime() < data.dateDebut.getTime()) {
    throw new BadRequestException(
      'La date de fin doit être postérieure ou égale à la date de début.',
    );
  }

  if (data.statut === 'TERMINEE' && data.dateFin.getTime() > dateRef.getTime()) {
    throw new BadRequestException(
      'Une mission ne peut pas être « Terminée » avec une date de fin dans le futur.',
    );
  }

  if (data.type === 'INTERMITTENCE') {
    if (data.heures == null && data.nbCachets == null) {
      throw new BadRequestException(
        'Une mission intermittence nécessite des heures ou un nombre de cachets.',
      );
    }
    const heures =
      data.nbCachets != null ? data.nbCachets * heuresParCachet : (data.heures as number);
    return {
      ...data,
      heures,
      nbCachets: data.nbCachets ?? null,
      montantHT: null,
      nbJours: null,
    };
  }

  // FREELANCE
  if (data.montantHT == null || data.nbJours == null) {
    throw new BadRequestException(
      'Une mission freelance nécessite un montant HT et un nombre de jours.',
    );
  }
  return {
    ...data,
    montantHT: data.montantHT,
    nbJours: data.nbJours,
    heures: null,
    nbCachets: null,
  };
}
