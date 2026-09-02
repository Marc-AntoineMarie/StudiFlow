/**
 * Génération PDF du récapitulatif d'une mission (module différenciant, en
 * complément de l'export ICS/CSV et des rappels). `pdfkit` produit un flux binaire
 * — cette fonction n'est pas "pure" au sens strict (elle a un effet : générer un
 * Buffer), mais reste isolée du reste de l'app (aucune dépendance Nest/Prisma).
 */
import PDFDocument from 'pdfkit';

export interface MissionPdfData {
  id: number;
  titre: string;
  clientOuProduction: string;
  type: 'INTERMITTENCE' | 'FREELANCE';
  statut: 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';
  dateDebut: Date;
  dateFin: Date;
  heures: number | null;
  montantHT: number | null;
  nbJours: number | null;
  note: string | null;
}

const LABEL_TYPE: Record<MissionPdfData['type'], string> = {
  INTERMITTENCE: 'Intermittence',
  FREELANCE: 'Freelance',
};

const LABEL_STATUT: Record<MissionPdfData['statut'], string> = {
  PROPOSEE: 'Proposée',
  CONFIRMEE: 'Confirmée',
  TERMINEE: 'Terminée',
};

function formatDate(d: Date): string {
  const jour = String(d.getUTCDate()).padStart(2, '0');
  const mois = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${jour}/${mois}/${d.getUTCFullYear()}`;
}

export function genererRecapitulatifPdf(mission: MissionPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#000').text('Récapitulatif de mission');
    doc.moveDown(0.5);
    doc.fontSize(14).text(mission.titre);
    doc.fontSize(10).fillColor('#555').text(mission.clientOuProduction);
    doc.moveDown();

    doc.fillColor('#000').fontSize(11);
    doc.text(`Type : ${LABEL_TYPE[mission.type]}`);
    doc.text(`Statut : ${LABEL_STATUT[mission.statut]}`);
    doc.text(`Période : du ${formatDate(mission.dateDebut)} au ${formatDate(mission.dateFin)}`);

    if (mission.type === 'INTERMITTENCE') {
      doc.text(`Heures : ${mission.heures ?? 0} h`);
    } else {
      doc.text(`Montant HT : ${(mission.montantHT ?? 0).toLocaleString('fr-FR')} €`);
      doc.text(`Nombre de jours : ${mission.nbJours ?? 0}`);
    }

    if (mission.note) {
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text('Note');
      doc.fillColor('#000').fontSize(11).text(mission.note);
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(`Généré par Cadré — mission #${mission.id}`, { align: 'right' });

    doc.end();
  });
}
