import { RappelsService } from './rappels.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';

describe('RappelsService', () => {
  it('assemble les missions (avec compte de documents) et la jauge du dashboard', async () => {
    const prisma = {
      mission: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            titre: 'Mission terminée sans doc',
            statut: 'TERMINEE',
            dateFin: new Date('2026-08-01T00:00:00.000Z'),
            _count: { documents: 0 },
          },
        ]),
      },
    };
    const dashboardService = {
      getIndicateurs: jest.fn().mockResolvedValue({
        jauge: { heuresCumulees: 100, seuil: 507, pourcentage: 100 / 507 },
      }),
    };

    const service = new RappelsService(
      prisma as unknown as PrismaService,
      dashboardService as unknown as DashboardService,
    );

    const rappels = await service.get();

    expect(prisma.mission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { statut: { in: ['CONFIRMEE', 'TERMINEE'] } } }),
    );
    expect(rappels).toHaveLength(1);
    expect(rappels[0].type).toBe('DOCUMENT_MANQUANT');
  });
});
