/**
 * Génération du CSV des missions (module différenciant). Fonction pure, testée
 * seule. Délimiteur `;` : c'est le séparateur attendu par Excel en locale
 * française (la virgule y est le séparateur décimal).
 */
export interface MissionExportCSV {
  id: number;
  titre: string;
  clientOuProduction: string;
  type: string;
  statut: string;
  dateDebut: Date;
  dateFin: Date;
  heures: number | null;
  montantHT: number | null;
  nbJours: number | null;
  note: string | null;
}

const ENTETES = [
  'id',
  'titre',
  'client_production',
  'type',
  'statut',
  'date_debut',
  'date_fin',
  'heures',
  'montant_ht',
  'nb_jours',
  'note',
];

function echapperCSV(valeur: string): string {
  if (/[",;\n]/.test(valeur)) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

function formatDateCSV(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function genererCSV(missions: MissionExportCSV[]): string {
  const lignes = [ENTETES.join(';')];

  for (const m of missions) {
    lignes.push(
      [
        String(m.id),
        echapperCSV(m.titre),
        echapperCSV(m.clientOuProduction),
        m.type,
        m.statut,
        formatDateCSV(m.dateDebut),
        formatDateCSV(m.dateFin),
        m.heures != null ? String(m.heures) : '',
        m.montantHT != null ? String(m.montantHT) : '',
        m.nbJours != null ? String(m.nbJours) : '',
        echapperCSV(m.note ?? ''),
      ].join(';'),
    );
  }

  return lignes.join('\r\n');
}
