export type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
export type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';
export type CategorieDocument = 'CONTRAT' | 'ATTESTATION_EMPLOYEUR' | 'DEVIS' | 'FACTURE' | 'AUTRE';
export type TagProjet = 'PRO' | 'PERSO';

export interface Mission {
  id: number;
  titre: string;
  clientOuProduction: string;
  type: TypeMission;
  statut: StatutMission;
  dateDebut: string; // "YYYY-MM-DD" ou ISO — toujours interprété en UTC
  dateFin: string;
  note: string | null;
  heures: number | null;
  nbCachets: number | null;
  montantHT: number | null;
  nbJours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppDocument {
  id: number;
  nomFichier: string;
  stockageNom: string;
  mimeType: string;
  tailleOctets: number;
  categorie: CategorieDocument;
  missionId: number | null;
  mission: { id: number; titre: string } | null;
  createdAt: string;
}

export type TypeRappel = 'FIN_CONTRAT' | 'DOCUMENT_MANQUANT' | 'SEUIL_HEURES';

export interface Rappel {
  type: TypeRappel;
  missionId: number | null;
  titre: string;
  dateFin: string | null;
  detail: string;
}

export interface Config {
  id: number;
  seuilHeures: number;
  dureeFenetreMois: number;
  journeeTypeHeures: number;
  heuresParCachet: number;
  updatedAt: string;
}

export interface Projet {
  id: number;
  titre: string;
  description: string;
  tag: TagProjet;
  date: string;
  lienVideo: string;
  createdAt: string;
  updatedAt: string;
}
