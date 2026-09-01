import {
  calculerIndicateurs,
  ConfigCalc,
  MissionCalc,
} from './rolling-window';

/** Date UTC à minuit à partir d'une chaîne "YYYY-MM-DD". */
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const CONFIG: ConfigCalc = {
  seuilHeures: 507,
  dureeFenetreMois: 12,
  journeeTypeHeures: 8,
};

/** dateRef de référence des tests : fenêtre = 2025-10-01 → 2026-09-01. */
const DATE_REF = d('2026-09-01');

function intermittence(over: Partial<MissionCalc>): MissionCalc {
  return {
    type: 'INTERMITTENCE',
    statut: 'CONFIRMEE',
    dateFin: d('2026-01-15'),
    heures: 0,
    ...over,
  };
}

function freelance(over: Partial<MissionCalc>): MissionCalc {
  return {
    type: 'FREELANCE',
    statut: 'CONFIRMEE',
    dateFin: d('2026-01-15'),
    montantHT: 0,
    nbJours: 0,
    ...over,
  };
}

describe('calculerIndicateurs — règle des 12 mois glissants', () => {
  it('cas 1 — mission dont dateFin === borneDebut est comptée', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2025-10-01'), heures: 10 })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(10);
  });

  it('cas 2 — mission dont dateFin === borneDebut - 1 jour est exclue', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2025-09-30'), heures: 10 })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(0);
  });

  it('cas 3 — mission à cheval sur la fenêtre : comptée en entier, pas de prorata', () => {
    // dateDebut n'existe pas dans le calcul : seule dateFin compte.
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2026-01-15'), heures: 60, statut: 'TERMINEE' })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(60);
  });

  it('cas 4 — mission PROPOSEE dans la fenêtre est exclue', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2026-03-01'), heures: 40, statut: 'PROPOSEE' })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(0);
  });

  it('cas 5 — mission CONFIRMEE future (dateFin > borneFin) est exclue', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2026-10-01'), heures: 30 })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(0);
  });

  it('cas 6 — année bissextile : dateRef 2024-02-29, fenêtre débute au 2023-03-01', () => {
    const r = calculerIndicateurs([], CONFIG, d('2024-02-29'));
    expect(r.fenetre.debut.toISOString()).toBe('2023-03-01T00:00:00.000Z');
    expect(r.caParMois).toHaveLength(12);
  });

  it('cas 7 — heures déjà converties depuis les cachets en amont', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2026-02-10'), heures: 24 })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.heuresCumulees).toBe(24);
  });

  it('cas 8 — dépassement du seuil : pourcentage > 1 et restant = 0', () => {
    const r = calculerIndicateurs(
      [intermittence({ dateFin: d('2026-05-01'), heures: 600 })],
      CONFIG,
      DATE_REF,
    );
    expect(r.jauge.pourcentage).toBeGreaterThan(1);
    expect(r.jauge.restant).toBe(0);
  });

  it('cas 9 — config non-défaut : seuil 300, fenêtre 6 mois', () => {
    const r = calculerIndicateurs(
      [],
      { seuilHeures: 300, dureeFenetreMois: 6, journeeTypeHeures: 8 },
      DATE_REF,
    );
    expect(r.jauge.seuil).toBe(300);
    expect(r.caParMois).toHaveLength(6);
    expect(r.fenetre.debut.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('cas 10 — aucune mission : tout à 0, aucun NaN, 12 seaux', () => {
    const r = calculerIndicateurs([], CONFIG, DATE_REF);
    expect(r.jauge.heuresCumulees).toBe(0);
    expect(r.jauge.pourcentage).toBe(0);
    expect(r.jauge.restant).toBe(507);
    expect(r.caTotal).toBe(0);
    expect(r.caParMois).toHaveLength(12);
    expect(r.repartition.partIntermittence).toBe(0);
    expect(r.repartition.partFreelance).toBe(0);
    expect(Number.isNaN(r.jauge.pourcentage)).toBe(false);
  });

  it('cas 11 — mois sans freelance au milieu de la fenêtre : seau présent à 0', () => {
    const r = calculerIndicateurs(
      [
        freelance({ dateFin: d('2025-11-10'), montantHT: 1000, nbJours: 2 }),
        freelance({ dateFin: d('2026-03-10'), montantHT: 2000, nbJours: 3 }),
      ],
      CONFIG,
      DATE_REF,
    );
    const janvier = r.caParMois.find((s) => s.mois === '2026-01');
    expect(janvier).toBeDefined();
    expect(janvier?.montantHT).toBe(0);
  });

  it('cas 12 — mix cohérent entre jauge, CA/mois et répartition', () => {
    const r = calculerIndicateurs(
      [
        intermittence({ dateFin: d('2025-11-20'), heures: 10 }),
        intermittence({ dateFin: d('2026-02-05'), heures: 20, statut: 'TERMINEE' }),
        freelance({ dateFin: d('2025-11-15'), montantHT: 1000, nbJours: 2 }),
        freelance({ dateFin: d('2026-02-15'), montantHT: 2000, nbJours: 3 }),
        // hors fenêtre : ne doit rien changer
        intermittence({ dateFin: d('2025-08-01'), heures: 99 }),
      ],
      CONFIG,
      DATE_REF,
    );

    expect(r.jauge.heuresCumulees).toBe(30);
    expect(r.caTotal).toBe(3000);
    expect(r.caParMois.find((s) => s.mois === '2025-11')?.montantHT).toBe(1000);
    expect(r.caParMois.find((s) => s.mois === '2026-02')?.montantHT).toBe(2000);
    expect(r.repartition.heuresIntermittence).toBe(30);
    expect(r.repartition.heuresFreelanceEq).toBe(40); // (2 + 3) jours * 8 h
    expect(r.repartition.partIntermittence).toBeCloseTo(30 / 70, 10);
    expect(r.repartition.partFreelance).toBeCloseTo(40 / 70, 10);
  });

  it('caParMois est trié par mois croissant et couvre la fenêtre', () => {
    const r = calculerIndicateurs([], CONFIG, DATE_REF);
    expect(r.caParMois[0].mois).toBe('2025-10');
    expect(r.caParMois[11].mois).toBe('2026-09');
    const cles = r.caParMois.map((s) => s.mois);
    expect([...cles].sort()).toEqual(cles);
  });

  it('ne mute pas le tableau de missions fourni', () => {
    const missions = [intermittence({ dateFin: d('2026-01-01'), heures: 5 })];
    const copie = JSON.parse(JSON.stringify(missions));
    calculerIndicateurs(missions, CONFIG, DATE_REF);
    expect(JSON.parse(JSON.stringify(missions))).toEqual(copie);
  });
});
