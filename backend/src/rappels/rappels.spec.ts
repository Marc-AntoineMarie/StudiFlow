import { construireRappels, MissionRappel } from './rappels';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const DATE_REF = d('2026-09-01');
const JAUGE_OK = { heuresCumulees: 100, seuil: 507, pourcentage: 100 / 507 };

function mission(over: Partial<MissionRappel>): MissionRappel {
  return {
    id: 1,
    titre: 'Mission',
    statut: 'CONFIRMEE',
    dateFin: d('2026-09-05'),
    nbDocuments: 0,
    ...over,
  };
}

describe('construireRappels', () => {
  it('mission confirmée se terminant dans 5 jours -> FIN_CONTRAT', () => {
    const rappels = construireRappels(
      [mission({ statut: 'CONFIRMEE', dateFin: d('2026-09-06') })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(1);
    expect(rappels[0].type).toBe('FIN_CONTRAT');
  });

  it('mission confirmée se terminant dans 20 jours -> aucun rappel', () => {
    const rappels = construireRappels(
      [mission({ statut: 'CONFIRMEE', dateFin: d('2026-09-21') })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(0);
  });

  it('mission confirmée déjà terminée (dateFin passée) -> aucun rappel', () => {
    const rappels = construireRappels(
      [mission({ statut: 'CONFIRMEE', dateFin: d('2026-08-20') })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(0);
  });

  it('mission proposée proche de sa fin -> aucun rappel (seul CONFIRMEE compte)', () => {
    const rappels = construireRappels(
      [mission({ statut: 'PROPOSEE', dateFin: d('2026-09-05') })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(0);
  });

  it('mission terminée sans document -> DOCUMENT_MANQUANT', () => {
    const rappels = construireRappels(
      [mission({ statut: 'TERMINEE', dateFin: d('2026-08-01'), nbDocuments: 0 })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(1);
    expect(rappels[0].type).toBe('DOCUMENT_MANQUANT');
  });

  it('mission terminée avec documents -> aucun rappel', () => {
    const rappels = construireRappels(
      [mission({ statut: 'TERMINEE', dateFin: d('2026-08-01'), nbDocuments: 2 })],
      JAUGE_OK,
      DATE_REF,
    );
    expect(rappels).toHaveLength(0);
  });

  it('jauge à 95% du seuil -> SEUIL_HEURES', () => {
    const rappels = construireRappels([], { heuresCumulees: 481, seuil: 507, pourcentage: 481 / 507 }, DATE_REF);
    expect(rappels).toHaveLength(1);
    expect(rappels[0].type).toBe('SEUIL_HEURES');
    expect(rappels[0].missionId).toBeNull();
  });

  it('jauge à 50% du seuil -> aucun rappel', () => {
    const rappels = construireRappels([], JAUGE_OK, DATE_REF);
    expect(rappels).toHaveLength(0);
  });

  it('jauge dépassant 100% -> toujours alertée', () => {
    const rappels = construireRappels([], { heuresCumulees: 600, seuil: 507, pourcentage: 600 / 507 }, DATE_REF);
    expect(rappels.some((r) => r.type === 'SEUIL_HEURES')).toBe(true);
  });

  it('combine plusieurs rappels sans se marcher dessus', () => {
    const rappels = construireRappels(
      [
        mission({ id: 1, statut: 'CONFIRMEE', dateFin: d('2026-09-03') }),
        mission({ id: 2, statut: 'TERMINEE', dateFin: d('2026-08-01'), nbDocuments: 0 }),
      ],
      { heuresCumulees: 481, seuil: 507, pourcentage: 481 / 507 },
      DATE_REF,
    );
    expect(rappels).toHaveLength(3);
    expect(rappels.map((r) => r.type).sort()).toEqual(['DOCUMENT_MANQUANT', 'FIN_CONTRAT', 'SEUIL_HEURES']);
  });
});
