import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';

const MIME_AUTORISES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MIME_IMAGES = ['image/png', 'image/jpeg', 'image/webp'];

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

    if (file.mimetype === 'application/pdf') {
      // Best-effort : ne bloque jamais la création du document si ça échoue.
      await this.storage.genererMiniaturePdf(stockageNom);
    }

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

  /**
   * Chemin d'une miniature d'aperçu : l'image d'origine pour les images (le
   * navigateur la redimensionne, pas besoin de la retoucher), la page 1 rendue pour
   * un PDF si elle existe, sinon rien (le frontend retombe sur une icône générique).
   */
  async getMiniature(id: number): Promise<{ chemin: string; mimeType: string } | null> {
    const document = await this.findOne(id);

    if (MIME_IMAGES.includes(document.mimeType)) {
      return { chemin: this.storage.cheminComplet(document.stockageNom), mimeType: document.mimeType };
    }

    if (document.mimeType === 'application/pdf') {
      const existe = await this.storage.miniatureExiste(document.stockageNom);
      if (existe) {
        return { chemin: this.storage.cheminMiniature(document.stockageNom), mimeType: 'image/png' };
      }
    }

    return null;
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    await this.storage.supprimer(document.stockageNom);
    await this.prisma.document.delete({ where: { id } });
  }
}
