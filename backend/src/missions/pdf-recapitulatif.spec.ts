import { genererRecapitulatifPdf, MissionPdfData } from './pdf-recapitulatif';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

function mission(over: Partial<MissionPdfData> = {}): MissionPdfData {
  return {
    id: 1,
    titre: 'Montage teaser festival',
    clientOuProduction: 'Studio X',
    type: 'INTERMITTENCE',
    statut: 'TERMINEE',
    dateDebut: d('2026-01-05'),
    dateFin: d('2026-01-10'),
    heures: 24,
    montantHT: null,
    nbJours: null,
    note: null,
    ...over,
  };
}

describe('genererRecapitulatifPdf', () => {
  it('produit un buffer commençant par la signature PDF', async () => {
    const buffer = await genererRecapitulatifPdf(mission());
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('fonctionne pour une mission freelance (branche montant/jours)', async () => {
    const buffer = await genererRecapitulatifPdf(
      mission({ type: 'FREELANCE', heures: null, montantHT: 1500, nbJours: 3 }),
    );
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });

  it('fonctionne avec une note renseignée', async () => {
    const buffer = await genererRecapitulatifPdf(mission({ note: 'Livraison en avance.' }));
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });
});
