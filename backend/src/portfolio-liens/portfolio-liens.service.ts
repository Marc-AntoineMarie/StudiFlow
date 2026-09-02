import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLienDto } from './dto/create-lien.dto';

@Injectable()
export class PortfolioLiensService {
  constructor(private readonly prisma: PrismaService) {}

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
        boiteProduction: true,
        clients: true,
      },
      orderBy: { date: 'desc' },
    });

    return { titre: lien.titre, projets };
  }
}
