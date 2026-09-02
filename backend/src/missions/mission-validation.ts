/**
 * Règles de cohérence d'une mission (indépendantes de Prisma/Nest, testables seules).
 * Ne couvre pas le calcul des 12 mois glissants — voir src/calc/rolling-window.ts.
 */
import { BadRequestException } from '@nestjs/common';

export type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
export type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';

export interface DonneesMission {
  type: TypeMission;
  statut: StatutMission;
  dateDebut: Date;
  dateFin: Date;
  heures?: number | null;
  nbCachets?: number | null;
  montantHT?: number | null;
  nbJours?: number | null;
}

/**
 * Valide une mission et normalise ses champs selon son type :
 * - INTERMITTENCE : heures ou nbCachets requis ; nbCachets prime et est converti en
 *   heures via heuresParCachet ; montantHT/nbJours forcés à null.
 * - FREELANCE : montantHT et nbJours requis ; heures/nbCachets forcés à null.
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
