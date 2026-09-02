import { genererCSV } from './csv';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('genererCSV', () => {
  it('liste vide : uniquement l\'en-tête', () => {
    const csv = genererCSV([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('id;titre;client_production');
  });

  it('mission intermittence : heures renseignées, montant/jours vides', () => {
    const csv = genererCSV([
      {
        id: 1,
        titre: 'Montage',
        clientOuProduction: 'Studio X',
        type: 'INTERMITTENCE',
        statut: 'TERMINEE',
        dateDebut: d('2026-01-05'),
        dateFin: d('2026-01-10'),
        heures: 24,
        montantHT: null,
        nbJours: null,
        note: null,
      },
    ]);
    const ligne = csv.split('\r\n')[1];
    expect(ligne).toBe('1;Montage;Studio X;INTERMITTENCE;TERMINEE;2026-01-05;2026-01-10;24;;;');
  });

  it('échappe une valeur contenant le délimiteur ou des guillemets', () => {
    const csv = genererCSV([
      {
        id: 2,
        titre: 'Client "VIP"; prioritaire',
        clientOuProduction: 'X',
        type: 'FREELANCE',
        statut: 'CONFIRMEE',
        dateDebut: d('2026-02-01'),
        dateFin: d('2026-02-01'),
        heures: null,
        montantHT: 500,
        nbJours: 1,
        note: null,
      },
    ]);
    expect(csv).toContain('"Client ""VIP""; prioritaire"');
  });
});
