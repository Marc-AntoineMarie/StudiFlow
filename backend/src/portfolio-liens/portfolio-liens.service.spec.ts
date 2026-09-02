import { NotFoundException } from '@nestjs/common';
import { PortfolioLiensService } from './portfolio-liens.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function reponseMock() {
  return { status: jest.fn().mockReturnThis(), send: jest.fn(), download: jest.fn() };
}

describe('PortfolioLiensService', () => {
  let prisma: {
    lienPortfolio: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    projet: { findMany: jest.Mock; findUnique: jest.Mock };
  };
  let storage: { streamerAvecRange: jest.Mock; miniatureExiste: jest.Mock; cheminMiniature: jest.Mock };
  let service: PortfolioLiensService;

  beforeEach(() => {
    prisma = {
      lienPortfolio: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      projet: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    storage = {
      streamerAvecRange: jest.fn().mockResolvedValue(undefined),
      miniatureExiste: jest.fn().mockResolvedValue(false),
      cheminMiniature: jest.fn().mockReturnValue('/app/uploads/uuid.mp4.png'),
    };
    service = new PortfolioLiensService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  });

  it('crée un lien avec les projetIds fournis', async () => {
    prisma.lienPortfolio.create.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2, 5] });
    await service.create({ titre: 'Client X', projetIds: [2, 5] });
    expect(prisma.lienPortfolio.create).toHaveBeenCalledWith({
      data: { titre: 'Client X', projetIds: [2, 5] },
    });
  });

  it('remove : 404 si le lien est déjà absent', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue(null);
    await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    expect(prisma.lienPortfolio.delete).not.toHaveBeenCalled();
  });

  it('remove : supprime le lien existant', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1 });
    await service.remove(1);
    expect(prisma.lienPortfolio.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('resoudrePublic : 404 si le token est inconnu (lien supprimé ou jamais créé)', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue(null);
    await expect(service.resoudrePublic('inconnu')).rejects.toThrow(NotFoundException);
    expect(prisma.projet.findMany).not.toHaveBeenCalled();
  });

  it('resoudrePublic : ne renvoie que les projets sélectionnés pour ce lien', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', titre: 'Sélection', projetIds: [2, 5] });
    prisma.projet.findMany.mockResolvedValue([{ id: 2, titre: 'A' }, { id: 5, titre: 'B' }]);

    const resultat = await service.resoudrePublic('tok1');

    expect(prisma.projet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [2, 5] } } }),
    );
    expect(resultat).toEqual({ titre: 'Sélection', projets: [{ id: 2, titre: 'A' }, { id: 5, titre: 'B' }] });
  });

  it('resoudrePublic : projet supprimé entre-temps -> simplement absent du résultat', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', titre: null, projetIds: [2, 999] });
    prisma.projet.findMany.mockResolvedValue([{ id: 2, titre: 'A' }]); // 999 n'existe plus

    const resultat = await service.resoudrePublic('tok1');

    expect(resultat.projets).toEqual([{ id: 2, titre: 'A' }]);
  });

  it('streamerVideoPublique : 404 si le token est inconnu', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue(null);
    const res = reponseMock();
    await service.streamerVideoPublique('inconnu', 2, {} as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(storage.streamerAvecRange).not.toHaveBeenCalled();
  });

  it("streamerVideoPublique : 404 si le projet n'est PAS dans la sélection de ce lien", async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2, 5] });
    const res = reponseMock();
    await service.streamerVideoPublique('tok1', 999, {} as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.projet.findUnique).not.toHaveBeenCalled();
  });

  it("streamerVideoPublique : 404 si le projet n'a pas de vidéo hébergée", async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2] });
    prisma.projet.findUnique.mockResolvedValue({ videoStockageNom: null, videoMimeType: null });
    const res = reponseMock();
    await service.streamerVideoPublique('tok1', 2, {} as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('streamerVideoPublique : stream la vidéo si le projet fait partie de la sélection', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2] });
    prisma.projet.findUnique.mockResolvedValue({ videoStockageNom: 'uuid.mp4', videoMimeType: 'video/mp4' });
    const req = {} as never;
    const res = reponseMock();
    await service.streamerVideoPublique('tok1', 2, req, res as never);
    expect(storage.streamerAvecRange).toHaveBeenCalledWith('uuid.mp4', 'video/mp4', req, res);
  });

  it("miniatureVideoPublique : 404 si le projet n'est pas dans la sélection de ce lien", async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2] });
    const res = reponseMock();
    await service.miniatureVideoPublique('tok1', 999, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.download).not.toHaveBeenCalled();
  });

  it("miniatureVideoPublique : 404 si la vignette n'a pas (encore) été générée", async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2] });
    prisma.projet.findUnique.mockResolvedValue({ videoStockageNom: 'uuid.mp4', videoMimeType: 'video/mp4' });
    storage.miniatureExiste.mockResolvedValue(false);
    const res = reponseMock();
    await service.miniatureVideoPublique('tok1', 2, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('miniatureVideoPublique : sert la vignette si le projet fait partie de la sélection', async () => {
    prisma.lienPortfolio.findUnique.mockResolvedValue({ id: 1, token: 'tok1', projetIds: [2] });
    prisma.projet.findUnique.mockResolvedValue({ videoStockageNom: 'uuid.mp4', videoMimeType: 'video/mp4' });
    storage.miniatureExiste.mockResolvedValue(true);
    const res = reponseMock();
    await service.miniatureVideoPublique('tok1', 2, res as never);
    expect(res.download).toHaveBeenCalledWith('/app/uploads/uuid.mp4.png', 'apercu');
  });
});
