/**
 * Cœur métier de Cadré : calcul des indicateurs du tableau de bord sur une fenêtre
 * de N mois glissants (alignée sur les mois calendaires).
 *
 * Fonction PURE : aucune I/O, aucun accès horloge interne (`dateRef` est injectée),
 * ne mute pas ses entrées, ne lève jamais sur des données vides ou incohérentes.
 *
 * Spécification de référence : docs/04-regle-12-mois-glissants.md
 * Ce fichier ne doit RIEN importer de @nestjs/* ni de @prisma/client.
 */

export type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
export type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';

export interface MissionCalc {
  type: TypeMission;
  statut: StatutMission;
  /** Date de fin = date de rattachement pour TOUS les calculs. */
  dateFin: Date;
  /** Intermittence : heures déjà converties depuis les cachets en amont. */
  heures?: number | null;
  /** Freelance. */
  montantHT?: number | null;
  /** Freelance. */
  nbJours?: number | null;
  /** Client (freelance) ou production (intermittence) — texte libre. */
  clientOuProduction: string;
}

export interface ConfigCalc {
  seuilHeures: number;
  dureeFenetreMois: number;
  journeeTypeHeures: number;
}

export interface Indicateurs {
  fenetre: { debut: Date; fin: Date };
  jauge: {
    heuresCumulees: number;
    seuil: number;
    pourcentage: number;
    restant: number;
  };
  caParMois: { mois: string; montantHT: number }[];
  caTotal: number;
  repartition: {
    heuresIntermittence: number;
    heuresFreelanceEq: number;
    partIntermittence: number;
    partFreelance: number;
  };
  repartitionClients: RepartitionClients;
}

/** Métrique utilisée pour peser chaque client dans la répartition. */
export type MetriqueClient = 'ACTIVITE' | 'CA' | 'NB_MISSIONS';

export interface PartClient {
  /** Nom du client, ou "Autres" pour la ligne d'agrégat au-delà du top 5. */
  client: string;
  /** Heures équivalentes, € ou nombre de missions selon la métrique. */
  valeur: number;
  /** Part du total, 0..1. */
  pourcentage: number;
}

export interface RepartitionClients {
  activite: PartClient[];
  ca: PartClient[];
  nbMissions: PartClient[];
}

const NB_CLIENTS_AFFICHES = 5;
const LABEL_AUTRES = 'Autres';

const STATUTS_COMPTES: ReadonlySet<StatutMission> = new Set<StatutMission>([
  'CONFIRMEE',
  'TERMINEE',
]);

/** Clé "YYYY-MM" d'une date, en UTC. */
function cleMois(annee: number, moisZeroBased: number): string {
  return `${annee}-${String(moisZeroBased + 1).padStart(2, '0')}`;
}

/**
 * Fenêtre glissante (alignée sur les mois) + missions éligibles dedans
 * (statut CONFIRMEE/TERMINEE). Partagé entre `calculerIndicateurs` et
 * `calculerRepartitionClients` pour ne pas dupliquer la règle des 12 mois.
 */
function fenetreEtEligibles(
  missions: MissionCalc[],
  config: ConfigCalc,
  dateRef: Date,
): { borneDebut: Date; borneFin: Date; indexMoisDebut: number; nbMois: number; eligibles: MissionCalc[] } {
  const nbMois = Math.max(1, Math.floor(config.dureeFenetreMois));

  const finAnnee = dateRef.getUTCFullYear();
  const finMois = dateRef.getUTCMonth(); // 0-11
  const indexMoisFin = finAnnee * 12 + finMois;
  const indexMoisDebut = indexMoisFin - (nbMois - 1);

  const debutAnnee = Math.floor(indexMoisDebut / 12);
  const debutMois = ((indexMoisDebut % 12) + 12) % 12;

  const borneDebut = new Date(Date.UTC(debutAnnee, debutMois, 1, 0, 0, 0, 0));
  const borneFin = dateRef;

  const debutTs = borneDebut.getTime();
  const finTs = borneFin.getTime();

  const eligibles = missions.filter((m) => {
    if (!STATUTS_COMPTES.has(m.statut)) return false;
    const t = m.dateFin.getTime();
    return t >= debutTs && t <= finTs;
  });

  return { borneDebut, borneFin, indexMoisDebut, nbMois, eligibles };
}

/** Valeur d'une mission pour une métrique donnée (unité selon la métrique). */
function valeurMission(m: MissionCalc, config: ConfigCalc, metrique: MetriqueClient): number {
  switch (metrique) {
    case 'ACTIVITE':
      return m.type === 'INTERMITTENCE'
        ? (m.heures ?? 0)
        : (m.nbJours ?? 0) * config.journeeTypeHeures;
    case 'CA':
      return m.type === 'FREELANCE' ? (m.montantHT ?? 0) : 0;
    case 'NB_MISSIONS':
      return 1;
  }
}

/** Regroupe des missions déjà éligibles par client, top 5 + "Autres". */
function repartitionPourMetrique(
  eligibles: MissionCalc[],
  config: ConfigCalc,
  metrique: MetriqueClient,
): PartClient[] {
  const parClient = new Map<string, number>();
  for (const m of eligibles) {
    const v = valeurMission(m, config, metrique);
    parClient.set(m.clientOuProduction, (parClient.get(m.clientOuProduction) ?? 0) + v);
  }

  const total = [...parClient.values()].reduce((acc, v) => acc + v, 0);

  const tries = [...parClient.entries()]
    .filter(([, valeur]) => valeur > 0)
    .sort(([, a], [, b]) => b - a);

  const tete = tries.slice(0, NB_CLIENTS_AFFICHES);
  const reste = tries.slice(NB_CLIENTS_AFFICHES);
  const valeurAutres = reste.reduce((acc, [, v]) => acc + v, 0);

  const lignes: PartClient[] = tete.map(([client, valeur]) => ({
    client,
    valeur,
    pourcentage: total > 0 ? valeur / total : 0,
  }));

  if (valeurAutres > 0) {
    lignes.push({
      client: LABEL_AUTRES,
      valeur: valeurAutres,
      pourcentage: total > 0 ? valeurAutres / total : 0,
    });
  }

  return lignes;
}

/** Répartition par client (top 5 + "Autres"), une liste par métrique. */
export function calculerRepartitionClients(
  missions: MissionCalc[],
  config: ConfigCalc,
  dateRef: Date,
): RepartitionClients {
  const { eligibles } = fenetreEtEligibles(missions, config, dateRef);
  return {
    activite: repartitionPourMetrique(eligibles, config, 'ACTIVITE'),
    ca: repartitionPourMetrique(eligibles, config, 'CA'),
    nbMissions: repartitionPourMetrique(eligibles, config, 'NB_MISSIONS'),
  };
}

export function calculerIndicateurs(
  missions: MissionCalc[],
  config: ConfigCalc,
  dateRef: Date,
): Indicateurs {
  const { borneDebut, borneFin, indexMoisDebut, nbMois, eligibles } = fenetreEtEligibles(
    missions,
    config,
    dateRef,
  );

  // --- Jauge (heures d'intermittence) ------------------------------------------
  const heuresCumulees = eligibles
    .filter((m) => m.type === 'INTERMITTENCE')
    .reduce((acc, m) => acc + (m.heures ?? 0), 0);

  const seuil = config.seuilHeures;
  const pourcentage = seuil > 0 ? heuresCumulees / seuil : 0;
  const restant = Math.max(0, seuil - heuresCumulees);

  // --- CA freelance par mois -------------------------------------------------
  const seaux = new Map<string, number>();
  for (let i = 0; i < nbMois; i++) {
    const idx = indexMoisDebut + i;
    const y = Math.floor(idx / 12);
    const mo = ((idx % 12) + 12) % 12;
    seaux.set(cleMois(y, mo), 0);
  }

  for (const m of eligibles) {
    if (m.type !== 'FREELANCE') continue;
    const cle = cleMois(m.dateFin.getUTCFullYear(), m.dateFin.getUTCMonth());
    if (seaux.has(cle)) {
      seaux.set(cle, (seaux.get(cle) as number) + (m.montantHT ?? 0));
    }
  }

  const caParMois = [...seaux.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([mois, montantHT]) => ({ mois, montantHT }));
  const caTotal = caParMois.reduce((acc, s) => acc + s.montantHT, 0);

  // --- Répartition intermittence / freelance -------------------------------
  const heuresFreelanceEq =
    eligibles
      .filter((m) => m.type === 'FREELANCE')
      .reduce((acc, m) => acc + (m.nbJours ?? 0), 0) * config.journeeTypeHeures;

  const totalHeures = heuresCumulees + heuresFreelanceEq;
  const partIntermittence = totalHeures > 0 ? heuresCumulees / totalHeures : 0;
  const partFreelance = totalHeures > 0 ? heuresFreelanceEq / totalHeures : 0;

  return {
    fenetre: { debut: borneDebut, fin: borneFin },
    jauge: { heuresCumulees, seuil, pourcentage, restant },
    caParMois,
    caTotal,
    repartition: {
      heuresIntermittence: heuresCumulees,
      heuresFreelanceEq,
      partIntermittence,
      partFreelance,
    },
    repartitionClients: {
      activite: repartitionPourMetrique(eligibles, config, 'ACTIVITE'),
      ca: repartitionPourMetrique(eligibles, config, 'CA'),
      nbMissions: repartitionPourMetrique(eligibles, config, 'NB_MISSIONS'),
    },
  };
}
