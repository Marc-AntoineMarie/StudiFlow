import { NotFoundException } from '@nestjs/common';
import { PortfolioLiensService } from './portfolio-liens.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PortfolioLiensService', () => {
  let prisma: {
    lienPortfolio: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    projet: { findMany: jest.Mock };
  };
  let service: PortfolioLiensService;

  beforeEach(() => {
    prisma = {
      lienPortfolio: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      projet: { findMany: jest.fn() },
    };
    service = new PortfolioLiensService(prisma as unknown as PrismaService);
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
});
