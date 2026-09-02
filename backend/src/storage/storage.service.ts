import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join } from 'node:path';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

/**
 * Stockage disque des documents. Abstrait derrière ce service pour permettre un
 * remplacement par un stockage S3-compatible plus tard (cf. docs/05-roadmap.md)
 * sans toucher au reste du module Documents.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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
    await this.supprimerMiniature(stockageNom);
  }

  cheminComplet(stockageNom: string): string {
    return join(this.dossier, stockageNom);
  }

  cheminMiniature(stockageNom: string): string {
    return join(this.dossier, `${stockageNom}.png`);
  }

  /**
   * Rend la 1ʳᵉ page d'un PDF en PNG via `pdftoppm` (poppler-utils, installé dans le
   * Dockerfile — pas de lib JS de rendu PDF : elles demandent des bindings natifs
   * type node-canvas, pénibles à compiler sous Alpine). Best-effort : une miniature
   * manquante ne doit jamais faire échouer un upload.
   */
  async genererMiniaturePdf(stockageNom: string): Promise<void> {
    const cheminPdf = this.cheminComplet(stockageNom);
    const prefixeSortie = this.cheminComplet(stockageNom); // pdftoppm -singlefile ajoute ".png"
    try {
      await execFileAsync('pdftoppm', [
        '-singlefile',
        '-png',
        '-f',
        '1',
        '-l',
        '1',
        '-scale-to',
        '320',
        cheminPdf,
        prefixeSortie,
      ]);
    } catch (err) {
      this.logger.warn(`Miniature PDF non générée pour ${stockageNom} : ${err}`);
    }
  }

  async miniatureExiste(stockageNom: string): Promise<boolean> {
    try {
      await stat(this.cheminMiniature(stockageNom));
      return true;
    } catch {
      return false;
    }
  }

  private async supprimerMiniature(stockageNom: string): Promise<void> {
    try {
      await unlink(this.cheminMiniature(stockageNom));
    } catch {
      // Pas de miniature à supprimer : rien à faire.
    }
  }
}
