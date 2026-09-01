export type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
export type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';

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
