import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join } from 'node:path';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { Request, Response } from 'express';

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

  /**
   * Sert un fichier avec support des requêtes `Range` (HTTP 206) — indispensable
   * pour qu'un <video> puisse "seek" au lieu de devoir tout charger d'un coup.
   * `res.download()` (utilisé pour les documents) ne gère pas ça, d'où cette
   * méthode dédiée, réutilisée par les deux routes de streaming vidéo (privée
   * et publique via un lien portfolio).
   */
  async streamerAvecRange(stockageNom: string, mimeType: string, req: Request, res: Response): Promise<void> {
    const chemin = this.cheminComplet(stockageNom);
    const { size } = await stat(chemin);
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      createReadStream(chemin).pipe(res);
      return;
    }

    const correspondance = /bytes=(\d*)-(\d*)/.exec(range);
    const debut = correspondance?.[1] ? parseInt(correspondance[1], 10) : 0;
    const finDemandee = correspondance?.[2] ? parseInt(correspondance[2], 10) : size - 1;
    const fin = Math.min(finDemandee, size - 1);

    res.writeHead(206, {
      'Content-Range': `bytes ${debut}-${fin}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': fin - debut + 1,
      'Content-Type': mimeType,
    });
    createReadStream(chemin, { start: debut, end: fin }).pipe(res);
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
