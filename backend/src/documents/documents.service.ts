import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';

const MIME_AUTORISES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(file: Express.Multer.File | undefined, dto: CreateDocumentDto) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    if (!MIME_AUTORISES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non autorisé (pdf, png, jpg, webp uniquement).',
      );
    }

    if (dto.missionId) {
      const mission = await this.prisma.mission.findUnique({ where: { id: dto.missionId } });
      if (!mission) throw new NotFoundException(`Mission ${dto.missionId} introuvable`);
    }

    const { stockageNom, tailleOctets } = await this.storage.enregistrer(
      file.buffer,
      file.originalname,
    );

    return this.prisma.document.create({
      data: {
        nomFichier: file.originalname,
        stockageNom,
        mimeType: file.mimetype,
        tailleOctets,
        categorie: dto.categorie,
        missionId: dto.missionId ?? null,
      },
    });
  }

  findAll(query: QueryDocumentsDto) {
    const where: Prisma.DocumentWhereInput = {};
    if (query.categorie) where.categorie = query.categorie;
    if (query.missionId === 'none') where.missionId = null;
    else if (query.missionId) where.missionId = Number(query.missionId);

    return this.prisma.document.findMany({
      where,
      include: { mission: { select: { id: true, titre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { mission: { select: { id: true, titre: true } } },
    });
    if (!document) throw new NotFoundException(`Document ${id} introuvable`);
    return document;
  }

  async getCheminTelechargement(id: number) {
    const document = await this.findOne(id);
    return {
      chemin: this.storage.cheminComplet(document.stockageNom),
      nomFichier: document.nomFichier,
      mimeType: document.mimeType,
    };
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await this.storage.supprimer(document.stockageNom);
    await this.prisma.document.delete({ where: { id } });
  }
}
