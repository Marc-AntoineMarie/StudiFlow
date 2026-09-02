import { CategorieDocument } from './types';

export const CATEGORIE_LABEL: Record<CategorieDocument, string> = {
  CONTRAT: 'Contrat',
  ATTESTATION_EMPLOYEUR: 'Attestation employeur',
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  AUTRE: 'Autre',
};

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const ko = octets / 1024;
  if (ko < 1024) return `${ko.toFixed(0)} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}
