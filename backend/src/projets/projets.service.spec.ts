import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjetsService', () => {
  let prisma: {
    projet: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock; findMany: jest.Mock };
  };
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
    service = new ProjetsService(prisma as unknown as PrismaService);
  });

  it('crée un projet avec un lien vidéo valide', async () => {
    await service.create(DTO_VALIDE);
    expect(prisma.projet.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ titre: DTO_VALIDE.titre }) }),
    );
  });

  it('rejette un lien vidéo hors YouTube/Vimeo à la création', async () => {
    await expect(
      service.create({ ...DTO_VALIDE, lienVideo: 'https://example.com/video.mp4' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un lien vidéo invalide à la mise à jour', async () => {
    prisma.projet.findUnique.mockResolvedValue({ id: 1 });
    await expect(
      service.update(1, { lienVideo: 'https://example.com/video.mp4' }),
    ).rejects.toThrow(BadRequestException);
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
});
