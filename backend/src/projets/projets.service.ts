import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Projet } from '@prisma/client';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { QueryProjetsDto } from './dto/query-projets.dto';
import { estLienVideoValide } from './video-lien';

const MESSAGE_LIEN_INVALIDE = 'Le lien vidéo doit pointer vers YouTube ou Vimeo.';
export const MIME_VIDEO_AUTORISES = ['video/mp4', 'video/webm', 'video/quicktime'];

@Injectable()
export class ProjetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateProjetDto): Promise<Projet> {
    if (dto.lienVideo && !estLienVideoValide(dto.lienVideo)) {
      throw new BadRequestException(MESSAGE_LIEN_INVALIDE);
    }
    return this.prisma.projet.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  findAll(query: QueryProjetsDto): Promise<Projet[]> {
    return this.prisma.projet.findMany({
      where: query.tag ? { tag: query.tag } : {},
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number): Promise<Projet> {
    const projet = await this.prisma.projet.findUnique({ where: { id } });
    if (!projet) throw new NotFoundException(`Projet ${id} introuvable`);
    return projet;
  }

  async update(id: number, dto: UpdateProjetDto): Promise<Projet> {
    const existant = await this.findOne(id);
    if (dto.lienVideo && !estLienVideoValide(dto.lienVideo)) {
      throw new BadRequestException(MESSAGE_LIEN_INVALIDE);
    }

    // Lien externe et vidéo hébergée sont mutuellement exclusifs : fixer un lien
    // externe efface une éventuelle vidéo déjà hébergée (fichier + champs).
    const effaceVideoHebergee = Boolean(dto.lienVideo) && Boolean(existant.videoStockageNom);
    if (effaceVideoHebergee) {
      await this.storage.supprimer(existant.videoStockageNom as string);
    }

    return this.prisma.projet.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        ...(effaceVideoHebergee
          ? { videoStockageNom: null, videoNomFichier: null, videoMimeType: null, videoTailleOctets: null }
          : {}),
      },
    });
  }

  async remove(id: number): Promise<void> {
    const projet = await this.findOne(id);
    if (projet.videoStockageNom) {
      await this.storage.supprimer(projet.videoStockageNom);
    }
    await this.prisma.projet.delete({ where: { id } });
  }

  /** Upload/remplacement de la vidéo hébergée — efface le lien externe (exclusivité mutuelle). */
  async uploaderVideo(id: number, file: Express.Multer.File | undefined): Promise<Projet> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (!MIME_VIDEO_AUTORISES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé (mp4, webm, mov uniquement).');
    }

    const projet = await this.findOne(id);
    if (projet.videoStockageNom) {
      await this.storage.supprimer(projet.videoStockageNom);
    }

    const { stockageNom, tailleOctets } = await this.storage.enregistrer(file.buffer, file.originalname);
    await this.storage.genererMiniatureVideo(stockageNom); // best-effort, cf. StorageService

    return this.prisma.projet.update({
      where: { id },
      data: {
        lienVideo: null,
        videoStockageNom: stockageNom,
        videoNomFichier: file.originalname,
        videoMimeType: file.mimetype,
        videoTailleOctets: tailleOctets,
      },
    });
  }

  streamerVideo(stockageNom: string, mimeType: string, req: Request, res: Response): Promise<void> {
    return this.storage.streamerAvecRange(stockageNom, mimeType, req, res);
  }

  /** Chemin de la vignette générée pour la vidéo hébergée, ou null si absente (best-effort). */
  async cheminMiniatureVideo(id: number): Promise<string | null> {
    const projet = await this.findOne(id);
    if (!projet.videoStockageNom) return null;
    const existe = await this.storage.miniatureExiste(projet.videoStockageNom);
    return existe ? this.storage.cheminMiniature(projet.videoStockageNom) : null;
  }

  /** Retire la vidéo hébergée (le projet se retrouve sans vidéo, sauf ajout d'un lien externe ensuite). */
  async supprimerVideo(id: number): Promise<Projet> {
    const projet = await this.findOne(id);
    if (projet.videoStockageNom) {
      await this.storage.supprimer(projet.videoStockageNom);
    }
    return this.prisma.projet.update({
      where: { id },
      data: { videoStockageNom: null, videoNomFichier: null, videoMimeType: null, videoTailleOctets: null },
    });
  }
}
