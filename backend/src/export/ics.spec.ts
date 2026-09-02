import { genererICS } from './ics';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('genererICS', () => {
  it('calendrier vide : enveloppe VCALENDAR valide, aucun VEVENT', () => {
    const ics = genererICS([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('une mission : DTEND = dateFin + 1 jour (exclusif, RFC 5545)', () => {
    const ics = genererICS([
      {
        id: 1,
        titre: 'Montage',
        clientOuProduction: 'Studio X',
        type: 'INTERMITTENCE',
        statut: 'TERMINEE',
        dateDebut: d('2026-01-05'),
        dateFin: d('2026-01-10'),
      },
    ]);
    expect(ics).toContain('UID:mission-1@cadre.local');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260105');
    expect(ics).toContain('DTEND;VALUE=DATE:20260111');
    expect(ics).toContain('SUMMARY:Montage');
  });

  it('échappe les caractères spéciaux (virgule, point-virgule, retour ligne)', () => {
    const ics = genererICS([
      {
        id: 2,
        titre: 'Titre, avec; virgule',
        clientOuProduction: 'Client\nMulti-ligne',
        type: 'FREELANCE',
        statut: 'CONFIRMEE',
        dateDebut: d('2026-02-01'),
        dateFin: d('2026-02-01'),
      },
    ]);
    expect(ics).toContain('SUMMARY:Titre\\, avec\\; virgule');
    expect(ics).toContain('Client\\nMulti-ligne');
  });

  it('DTEND franchit un changement de mois correctement', () => {
    const ics = genererICS([
      {
        id: 3,
        titre: 'Fin de mois',
        clientOuProduction: 'X',
        type: 'INTERMITTENCE',
        statut: 'TERMINEE',
        dateDebut: d('2026-01-30'),
        dateFin: d('2026-01-31'),
      },
    ]);
    expect(ics).toContain('DTEND;VALUE=DATE:20260201');
  });
});
