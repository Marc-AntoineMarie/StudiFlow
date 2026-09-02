import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdir, unlink, writeFile } from 'node:fs/promises';

/**
 * Stockage disque des documents. Abstrait derrière ce service pour permettre un
 * remplacement par un stockage S3-compatible plus tard (cf. docs/05-roadmap.md)
 * sans toucher au reste du module Documents.
 */
@Injectable()
export class StorageService {
  private readonly dossier = process.env.UPLOAD_DIR ?? './uploads';

  private async assurerDossier(): Promise<void> {
    await mkdir(this.dossier, { recursive: true });
  }

  /** Écrit le fichier sous un nom UUID (anti-collision, anti path-traversal). */
  async enregistrer(
    buffer: Buffer,
    nomOriginal: string,
  ): Promise<{ stockageNom: string; tailleOctets: number }> {
    await this.assurerDossier();
    const stockageNom = `${randomUUID()}${extname(nomOriginal)}`;
    await writeFile(join(this.dossier, stockageNom), buffer);
    return { stockageNom, tailleOctets: buffer.length };
  }

  async supprimer(stockageNom: string): Promise<void> {
    try {
      await unlink(join(this.dossier, stockageNom));
    } catch {
      // Fichier déjà absent du disque : pas bloquant pour la suppression en base.
    }
  }

  cheminComplet(stockageNom: string): string {
    return join(this.dossier, stockageNom);
  }
}
