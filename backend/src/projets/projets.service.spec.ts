import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function fichierVideo(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'showreel.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    buffer: Buffer.from('contenu'),
    size: 7,
    ...overrides,
  } as Express.Multer.File;
}

describe('ProjetsService', () => {
  let prisma: {
    projet: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock; findMany: jest.Mock };
  };
  let storage: { enregistrer: jest.Mock; supprimer: jest.Mock; streamerAvecRange: jest.Mock };
  let service: ProjetsService;

  const DTO_VALIDE = {
    titre: 'Teaser festival',
    description: 'Montage rythmé',
    tag: 'PRO' as const,
    date: '2026-07-08',
    lienVideo: 'https://youtu.be/dQw4w9WgXcQ',
  };

  beforeEach(() => {
    prisma = {
      projet: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 1 }),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    storage = {
      enregistrer: jest.fn().mockResolvedValue({ stockageNom: 'uuid.mp4', tailleOctets: 7 }),
      supprimer: jest.fn().mockResolvedValue(undefined),
      streamerAvecRange: jest.fn().mockResolvedValue(undefined),
    };
    service = new ProjetsService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  });

  it('crée un projet avec un lien vidéo valide', async () => {
    await service.create(DTO_VALIDE);
    expect(prisma.projet.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ titre: DTO_VALIDE.titre }) }),
    );
  });

  it('crée un projet sans aucune vidéo (ajoutée après coup)', async () => {
    const { lienVideo, ...sansVideo } = DTO_VALIDE;
    void lienVideo;
    await service.create(sansVideo as never);
    expect(prisma.projet.create).toHaveBeenCalled();
  });

  it('rejette un lien vidéo hors YouTube/Vimeo à la création', async () => {
    await expect(
      service.create({ ...DTO_VALIDE, lienVideo: 'https://example.com/video.mp4' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un lien vidéo invalide à la mise à jour', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: null });
    await expect(
      service.update(1, { lienVideo: 'https://example.com/video.mp4' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update : fixer un lien externe efface la vidéo hébergée existante', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: 'uuid.mp4' });
    await service.update(1, { lienVideo: 'https://youtu.be/dQw4w9WgXcQ' });
    expect(storage.supprimer).toHaveBeenCalledWith('uuid.mp4');
    expect(prisma.projet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ videoStockageNom: null, videoNomFichier: null }),
      }),
    );
  });

  it('findOne : 404 si absent', async () => {
    prisma.projet.findUnique.mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
  });

  it('findAll : filtre par tag quand fourni', async () => {
    await service.findAll({ tag: 'PERSO' });
    expect(prisma.projet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tag: 'PERSO' } }),
    );
  });

  it('remove : supprime aussi la vidéo hébergée si présente', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: 'uuid.mp4' });
    await service.remove(1);
    expect(storage.supprimer).toHaveBeenCalledWith('uuid.mp4');
    expect(prisma.projet.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('uploaderVideo : rejette sans fichier', async () => {
    await expect(service.uploaderVideo(1, undefined)).rejects.toThrow(BadRequestException);
  });

  it('uploaderVideo : rejette un type MIME non autorisé', async () => {
    await expect(
      service.uploaderVideo(1, fichierVideo({ mimetype: 'application/zip' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploaderVideo : enregistre le fichier et efface le lien externe', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: null });
    await service.uploaderVideo(1, fichierVideo());
    expect(storage.enregistrer).toHaveBeenCalledWith(expect.any(Buffer), 'showreel.mp4');
    expect(prisma.projet.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        lienVideo: null,
        videoStockageNom: 'uuid.mp4',
        videoNomFichier: 'showreel.mp4',
        videoMimeType: 'video/mp4',
        videoTailleOctets: 7,
      }),
    });
  });

  it('uploaderVideo : remplace une vidéo hébergée existante (supprime l’ancien fichier)', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: 'ancien.mp4' });
    await service.uploaderVideo(1, fichierVideo());
    expect(storage.supprimer).toHaveBeenCalledWith('ancien.mp4');
  });

  it('supprimerVideo : efface le fichier et les champs', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1, videoStockageNom: 'uuid.mp4' });
    await service.supprimerVideo(1);
    expect(storage.supprimer).toHaveBeenCalledWith('uuid.mp4');
    expect(prisma.projet.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { videoStockageNom: null, videoNomFichier: null, videoMimeType: null, videoTailleOctets: null },
    });
  });
});
