import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Projet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { QueryProjetsDto } from './dto/query-projets.dto';
import { estLienVideoValide } from './video-lien';

const MESSAGE_LIEN_INVALIDE = 'Le lien vidéo doit pointer vers YouTube ou Vimeo.';

@Injectable()
export class ProjetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjetDto): Promise<Projet> {
    if (!estLienVideoValide(dto.lienVideo)) {
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
    await this.findOne(id);
    if (dto.lienVideo && !estLienVideoValide(dto.lienVideo)) {
      throw new BadRequestException(MESSAGE_LIEN_INVALIDE);
    }
    return this.prisma.projet.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.projet.delete({ where: { id } });
  }
}
