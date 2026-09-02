/**
 * Jeu de données de démo — livrable du brief (~20 missions sur 14 mois, quelques
 * documents, quelques projets). Remplace le contenu métier existant (missions,
 * documents, projets) par un jeu curaté et cohérent ; ne touche jamais User/Config.
 *
 * Usage : docker compose exec backend npm run seed:demo
 *
 * Dates ancrées autour du 2026-09-02 ("aujourd'hui" au moment de l'écriture). La
 * règle des 12 mois glissants reste correcte si ce seed est rejoué plus tard — les
 * dates ne coulissent simplement plus "autour d'aujourd'hui" à l'identique.
 */
import { PrismaClient, CategorieDocument, StatutMission, TagProjet, TypeMission } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { StorageService } from '../src/storage/storage.service';

const prisma = new PrismaClient();
const storage = new StorageService();

function genererPdfSimple(titre: string, sousTitre: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).text(titre);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(sousTitre);
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#999').text('Document de démonstration généré pour Cadré.');
    doc.end();
  });
}

interface MissionSeed {
  titre: string;
  clientOuProduction: string;
  type: TypeMission;
  statut: StatutMission;
  dateDebut: string;
  dateFin: string;
  heures?: number;
  nbCachets?: number;
  montantHT?: number;
  nbJours?: number;
  note?: string;
}

const MISSIONS: MissionSeed[] = [
  { titre: "Bande-annonce - court-métrage « Marée basse »", clientOuProduction: 'Studio Lumen', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2025-07-14', dateFin: '2025-07-18', montantHT: 1200, nbJours: 3, note: 'Étalonnage + mixage son inclus.' },
  { titre: 'Assistance vidéo - Top 14 (J1, Toulouse - Racing 92)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-09-06', dateFin: '2025-09-06', heures: 10 },
  { titre: 'Régie vidéo - Top 14 (J3, weekend double)', clientOuProduction: 'Canal+ Sport', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-09-20', dateFin: '2025-09-21', nbCachets: 2 },
  { titre: 'Film corporate - présentation entreprise', clientOuProduction: 'Frère & Fils BTP', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2025-09-25', dateFin: '2025-09-27', montantHT: 1800, nbJours: 3 },
  { titre: 'Assistance vidéo - Top 14 (J6)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-10-11', dateFin: '2025-10-11', heures: 8 },
  { titre: 'Habillage diffusion - Champions Cup (poule)', clientOuProduction: 'Canal+ Sport', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-10-18', dateFin: '2025-10-19', heures: 18 },
  { titre: 'Clip promotionnel - ouverture de magasin', clientOuProduction: 'Maison Verrier', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2025-11-02', dateFin: '2025-11-02', montantHT: 600, nbJours: 1 },
  { titre: "Assistance vidéo - tournée d'automne (test-match)", clientOuProduction: 'France TV Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-11-15', dateFin: '2025-11-16', heures: 16 },
  { titre: 'Assistance vidéo - Top 14 (J11)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-11-29', dateFin: '2025-11-29', heures: 8 },
  { titre: "Bande-annonce - web-série « Nocturne »", clientOuProduction: 'Studio Lumen', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2025-12-06', dateFin: '2025-12-10', montantHT: 2000, nbJours: 4, note: "Décalage 6-10 déc. : livraison le 10, tournage client fini le 8." },
  { titre: 'Montage résumé - Top 14 (bilan de phase 1)', clientOuProduction: 'Canal+ Sport', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2025-12-20', dateFin: '2025-12-20', heures: 8 },
  { titre: 'Assistance vidéo - Top 14 (reprise, J14-15)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-01-10', dateFin: '2026-01-11', heures: 16 },
  { titre: 'Publicité - lancement produit', clientOuProduction: 'Kinetik Agency', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-01-24', dateFin: '2026-01-24', montantHT: 700, nbJours: 1 },
  { titre: 'Assistance vidéo - Tournoi des 6 Nations (France-Écosse)', clientOuProduction: 'France TV Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-02-06', dateFin: '2026-02-08', nbCachets: 3 },
  { titre: "Montage teaser - festival du film indépendant", clientOuProduction: 'Agence Kaïros', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-02-08', dateFin: '2026-02-09', montantHT: 900, nbJours: 2, note: 'Dates à cheval sur la mission 6 Nations : chevauchement assumé.' },
  { titre: 'Assistance vidéo - Tournoi des 6 Nations (France-Irlande)', clientOuProduction: 'France TV Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-02-21', dateFin: '2026-02-21', heures: 8 },
  { titre: 'Assistance vidéo - Top 14 (J19)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-03-14', dateFin: '2026-03-14', heures: 8 },
  { titre: "Film corporate - portrait d'entreprise", clientOuProduction: 'Atelier Nord', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-03-28', dateFin: '2026-03-30', montantHT: 1500, nbJours: 3 },
  { titre: 'Assistance vidéo - Top 14 (J23)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: '2026-04-18', dateFin: '2026-04-18', heures: 8 },
  { titre: 'Assistance vidéo - phases finales Top 14 (barrages)', clientOuProduction: 'Canal+ Sport', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-05-09', dateFin: '2026-05-10', heures: 16 },
  { titre: 'Publicité - campagne de printemps', clientOuProduction: 'Kinetik Agency', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-05-23', dateFin: '2026-05-23', montantHT: 550, nbJours: 1 },
  { titre: 'Assistance vidéo - finale Top 14', clientOuProduction: 'Canal+ Sport', type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: '2026-06-13', dateFin: '2026-06-13', nbCachets: 2 },
  { titre: "Bande-annonce - court-métrage « Lignes de fuite »", clientOuProduction: 'Studio Lumen', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-07-06', dateFin: '2026-07-10', montantHT: 1000, nbJours: 2, note: '2 jours facturés sur une semaine de dispo (attente retours client).' },
  { titre: 'Clip promotionnel - nouvelle collection', clientOuProduction: 'Maison Verrier', type: 'FREELANCE', statut: 'CONFIRMEE', dateDebut: '2026-07-20', dateFin: '2026-07-20', montantHT: 500, nbJours: 1 },
  { titre: 'Assistance vidéo - match de préparation (amical)', clientOuProduction: 'France TV Rugby', type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: '2026-08-08', dateFin: '2026-08-09', heures: 16 },
  { titre: 'Publicité réseaux sociaux - rentrée', clientOuProduction: 'Kinetik Agency', type: 'FREELANCE', statut: 'TERMINEE', dateDebut: '2026-08-22', dateFin: '2026-08-22', montantHT: 480, nbJours: 1 },
  { titre: 'Assistance vidéo - Top 14 (J1, saison 2026-27)', clientOuProduction: 'LNR - Ligue Nationale de Rugby', type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: '2026-09-05', dateFin: '2026-09-05', heures: 8 },
  { titre: "Bande-annonce - long-métrage indépendant « Aval »", clientOuProduction: 'Agence Kaïros', type: 'FREELANCE', statut: 'PROPOSEE', dateDebut: '2026-09-12', dateFin: '2026-09-14', montantHT: 2400, nbJours: 4, note: 'Devis envoyé, en attente de confirmation.' },
];

interface DocumentSeed {
  titre: string;
  categorie: CategorieDocument;
  missionTitre?: string; // undefined = document global
}

const DOCUMENTS: DocumentSeed[] = [
  { titre: 'Contrat - Assistance vidéo Top 14 J1', categorie: 'CONTRAT', missionTitre: 'Assistance vidéo - Top 14 (J1, Toulouse - Racing 92)' },
  { titre: "Attestation employeur - tournée d'automne", categorie: 'ATTESTATION_EMPLOYEUR', missionTitre: "Assistance vidéo - tournée d'automne (test-match)" },
  { titre: 'Devis - Bande-annonce Marée basse', categorie: 'DEVIS', missionTitre: "Bande-annonce - court-métrage « Marée basse »" },
  { titre: 'Facture - Film corporate Frère & Fils BTP', categorie: 'FACTURE', missionTitre: 'Film corporate - présentation entreprise' },
  { titre: 'Contrat-cadre LNR 2025-2026', categorie: 'CONTRAT' },
  { titre: 'Charte graphique - éléments récurrents', categorie: 'AUTRE' },
  { titre: 'Attestation employeur - Champions Cup', categorie: 'ATTESTATION_EMPLOYEUR', missionTitre: 'Habillage diffusion - Champions Cup (poule)' },
  { titre: 'Facture - Nocturne teaser web-série', categorie: 'FACTURE', missionTitre: "Bande-annonce - web-série « Nocturne »" },
  { titre: 'Devis - Film corporate Atelier Nord', categorie: 'DEVIS', missionTitre: "Film corporate - portrait d'entreprise" },
  { titre: 'Facture - Pub lancement Kinetik', categorie: 'FACTURE', missionTitre: 'Publicité - lancement produit' },
  { titre: 'Attestation employeur - 6 Nations Écosse', categorie: 'ATTESTATION_EMPLOYEUR', missionTitre: 'Assistance vidéo - Tournoi des 6 Nations (France-Écosse)' },
  { titre: 'Contrat - Teaser festival indépendant', categorie: 'CONTRAT', missionTitre: 'Montage teaser - festival du film indépendant' },
  { titre: 'Facture - Barrages Top 14', categorie: 'FACTURE', missionTitre: 'Assistance vidéo - phases finales Top 14 (barrages)' },
  { titre: 'Devis - Pub campagne printemps', categorie: 'DEVIS', missionTitre: 'Publicité - campagne de printemps' },
];

interface ProjetSeed {
  titre: string;
  description: string;
  tag: TagProjet;
  date: string;
  lienVideo: string;
  boiteProduction?: string;
  clients?: string[];
}

const PROJETS: ProjetSeed[] = [
  { titre: 'Marée basse', description: 'Court-métrage — montage, étalonnage et mixage son.', tag: 'PRO', date: '2025-07-18', lienVideo: 'https://youtu.be/dQw4w9WgXcQ', boiteProduction: 'Studio Lumen' },
  { titre: 'Nocturne — teaser web-série', description: 'Teaser de lancement, rythme soutenu pour les réseaux.', tag: 'PRO', date: '2025-12-10', lienVideo: 'https://www.youtube.com/watch?v=9bZkp7q19f0', clients: ['Studio Lumen'] },
  { titre: 'Top 14 — meilleurs moments de saison', description: 'Compilation des temps forts de la phase régulière.', tag: 'PRO', date: '2026-06-15', lienVideo: 'https://youtu.be/jNQXAC9IVRw', clients: ['LNR', 'Canal+ Sport'] },
  { titre: 'Frère & Fils BTP — film corporate', description: "Portrait d'entreprise, 3 min, tourné sur 3 chantiers.", tag: 'PRO', date: '2025-09-30', lienVideo: 'https://vimeo.com/76979871', boiteProduction: 'Atelier Nord', clients: ['Frère & Fils BTP'] },
  { titre: 'Carnet de route — court doc voyage', description: 'Projet personnel, montage libre sans contrainte de délai.', tag: 'PERSO', date: '2026-04-02', lienVideo: 'https://youtu.be/dQw4w9WgXcQ' },
  { titre: 'Showreel 2026', description: 'Bande de démo — sélection des meilleurs plans de l’année.', tag: 'PRO', date: '2026-08-25', lienVideo: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
];

async function main() {
  console.log('→ Nettoyage des données métier existantes (missions, documents, projets)…');
  await prisma.document.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.projet.deleteMany();

  console.log(`→ Création de ${MISSIONS.length} missions…`);
  const idParTitre = new Map<string, number>();
  for (const m of MISSIONS) {
    const heures = m.type === 'INTERMITTENCE' ? (m.nbCachets != null ? m.nbCachets * 8 : (m.heures ?? null)) : null;
    const created = await prisma.mission.create({
      data: {
        titre: m.titre,
        clientOuProduction: m.clientOuProduction,
        type: m.type,
        statut: m.statut,
        dateDebut: new Date(m.dateDebut),
        dateFin: new Date(m.dateFin),
        heures,
        nbCachets: m.type === 'INTERMITTENCE' ? (m.nbCachets ?? null) : null,
        montantHT: m.type === 'FREELANCE' ? (m.montantHT ?? null) : null,
        nbJours: m.type === 'FREELANCE' ? (m.nbJours ?? null) : null,
        note: m.note ?? null,
      },
    });
    idParTitre.set(m.titre, created.id);
  }

  console.log(`→ Création de ${DOCUMENTS.length} documents (PDF générés + miniatures)…`);
  for (const d of DOCUMENTS) {
    const buffer = await genererPdfSimple(d.titre, d.missionTitre ?? 'Document global');
    const { stockageNom, tailleOctets } = await storage.enregistrer(buffer, `${d.titre}.pdf`);
    await storage.genererMiniaturePdf(stockageNom);
    await prisma.document.create({
      data: {
        nomFichier: `${d.titre}.pdf`,
        stockageNom,
        mimeType: 'application/pdf',
        tailleOctets,
        categorie: d.categorie,
        missionId: d.missionTitre ? (idParTitre.get(d.missionTitre) ?? null) : null,
      },
    });
  }

  console.log(`→ Création de ${PROJETS.length} projets portfolio…`);
  for (const p of PROJETS) {
    await prisma.projet.create({
      data: {
        titre: p.titre,
        description: p.description,
        tag: p.tag,
        date: new Date(p.date),
        lienVideo: p.lienVideo,
        boiteProduction: p.boiteProduction ?? null,
        clients: p.clients ?? [],
      },
    });
  }

  console.log('✓ Jeu de données de démo prêt.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
