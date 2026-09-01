import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('DashboardService', () => {
  it('délègue au calcul avec les missions et la config chargées', async () => {
    const prisma = {
      mission: {
        findMany: jest.fn().mockResolvedValue([
          { type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateFin: d('2026-08-01'), heures: 20, montantHT: null, nbJours: null },
        ]),
      },
      config: {
        findUnique: jest.fn().mockResolvedValue({
          seuilHeures: 507,
          dureeFenetreMois: 12,
          journeeTypeHeures: 8,
          heuresParCachet: 8,
        }),
      },
    };

    const service = new DashboardService(prisma as unknown as PrismaService);
    const result = await service.getIndicateurs(d('2026-09-01'));

    expect(result.jauge.heuresCumulees).toBe(20);
    expect(result.caParMois).toHaveLength(12);
  });

  it('retombe sur une config par défaut si la ligne Config est absente', async () => {
    const prisma = {
      mission: { findMany: jest.fn().mockResolvedValue([]) },
      config: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    const service = new DashboardService(prisma as unknown as PrismaService);
    const result = await service.getIndicateurs(d('2026-09-01'));

    expect(result.jauge.seuil).toBe(507);
    expect(result.caParMois).toHaveLength(12);
  });
});
