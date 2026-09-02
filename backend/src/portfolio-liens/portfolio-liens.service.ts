import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateLienDto } from './dto/create-lien.dto';

@Injectable()
export class PortfolioLiensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  create(dto: CreateLienDto) {
    return this.prisma.lienPortfolio.create({
      data: { titre: dto.titre, projetIds: dto.projetIds },
    });
  }

  findAll() {
    return this.prisma.lienPortfolio.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async remove(id: number): Promise<void> {
    const existe = await this.prisma.lienPortfolio.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException(`Lien ${id} introuvable`);
    await this.prisma.lienPortfolio.delete({ where: { id } });
  }

  /**
   * Résolution publique (pas d'auth) : ne renvoie QUE le titre du lien et les
   * projets explicitement sélectionnés — jamais de mission, document ou CA.
   * Un id de projetIds pointant vers un projet supprimé disparaît simplement
   * (pas de FK stricte sur ce tableau scalaire).
   */
  async resoudrePublic(token: string) {
    const lien = await this.prisma.lienPortfolio.findUnique({ where: { token } });
    if (!lien) throw new NotFoundException('Lien introuvable ou supprimé.');

    const projets = await this.prisma.projet.findMany({
      where: { id: { in: lien.projetIds } },
      select: {
        id: true,
        titre: true,
        description: true,
        tag: true,
        date: true,
        lienVideo: true,
        videoStockageNom: true,
        videoNomFichier: true,
        videoMimeType: true,
        videoTailleOctets: true,
        boiteProduction: true,
        clients: true,
      },
      orderBy: { date: 'desc' },
    });

    return { titre: lien.titre, projets };
  }

  /**
   * N'autorise QUE les projets effectivement sélectionnés pour CE lien (jamais
   * un projet au hasard par son id) : même garantie que resoudrePublic,
   * partagée par le streaming vidéo et sa vignette.
   */
  private async projetAutorisePourLien(token: string, projetId: number) {
    const lien = await this.prisma.lienPortfolio.findUnique({ where: { token } });
    if (!lien || !lien.projetIds.includes(projetId)) return null;
    return this.prisma.projet.findUnique({
      where: { id: projetId },
      select: { videoStockageNom: true, videoMimeType: true },
    });
  }

  async streamerVideoPublique(token: string, projetId: number, req: Request, res: Response): Promise<void> {
    const projet = await this.projetAutorisePourLien(token, projetId);
    if (!projet?.videoStockageNom || !projet.videoMimeType) {
      res.status(404).send();
      return;
    }
    await this.storage.streamerAvecRange(projet.videoStockageNom, projet.videoMimeType, req, res);
  }

  async miniatureVideoPublique(token: string, projetId: number, res: Response): Promise<void> {
    const projet = await this.projetAutorisePourLien(token, projetId);
    const existe = projet?.videoStockageNom ? await this.storage.miniatureExiste(projet.videoStockageNom) : false;
    if (!projet?.videoStockageNom || !existe) {
      res.status(404).send();
      return;
    }
    res.download(this.storage.cheminMiniature(projet.videoStockageNom), 'apercu');
  }
}
