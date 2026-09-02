import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { construireRappels, MissionRappel, Rappel } from './rappels';

@Injectable()
export class RappelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
  ) {}

  async get(): Promise<Rappel[]> {
    const [missions, indicateurs] = await Promise.all([
      this.prisma.mission.findMany({
        where: { statut: { in: ['CONFIRMEE', 'TERMINEE'] } },
        select: {
          id: true,
          titre: true,
          statut: true,
          dateFin: true,
          _count: { select: { documents: true } },
        },
      }),
      this.dashboardService.getIndicateurs(),
    ]);

    const missionsRappel: MissionRappel[] = missions.map((m) => ({
      id: m.id,
      titre: m.titre,
      statut: m.statut,
      dateFin: m.dateFin,
      nbDocuments: m._count.documents,
    }));

    return construireRappels(missionsRappel, indicateurs.jauge, new Date());
  }
}
