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
  /**
   * JOUR_PAR_JOUR dérive dateDebut/dateFin de joursTravailles, et en plus :
   * nbJours (freelance, un jour coché = un jour facturé) ou nbCachets
   * (intermittence, un jour coché = un cachet — convention déjà en place pour
   * la conversion cachets→heures).
   */
  modeJours?: ModeJours;
  /** "YYYY-MM-DD", pertinent seulement si modeJours = JOUR_PAR_JOUR. */
  joursTravailles?: string[];
}

/**
 * Valide une mission et normalise ses champs selon son type :
 * - INTERMITTENCE, mode PLAGE (défaut) : heures ou nbCachets requis, saisis
 *   directement ; nbCachets prime et est converti en heures via heuresParCachet.
 * - INTERMITTENCE, mode JOUR_PAR_JOUR : nbCachets = nombre de jours cochés (un
 *   jour = un cachet), converti en heures comme au-dessus.
 * - FREELANCE, mode PLAGE (défaut) : comportement historique inchangé — dateDebut,
 *   dateFin, montantHT et nbJours saisis directement.
 * - FREELANCE, mode JOUR_PAR_JOUR : nbJours = nombre de jours cochés.
 * - Dans les deux cas JOUR_PAR_JOUR : dateDebut/dateFin sont dérivées de
 *   joursTravailles (min, max) — jamais saisies à la main, donc jamais en
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
  const modeJourParJour = data.modeJours === 'JOUR_PAR_JOUR';

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
      ...(data.type === 'FREELANCE' ? { nbJours: jours.length } : { nbCachets: jours.length }),
      modeJours: 'JOUR_PAR_JOUR',
      joursTravailles: tries,
    };
  } else {
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
