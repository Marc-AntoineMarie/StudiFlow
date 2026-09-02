import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculerIndicateurs,
  ConfigCalc,
  Indicateurs,
  MissionCalc,
} from '../calc/rolling-window';

const CONFIG_PAR_DEFAUT: ConfigCalc = {
  seuilHeures: 507,
  dureeFenetreMois: 12,
  journeeTypeHeures: 8,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getIndicateurs(dateRef: Date = new Date()): Promise<Indicateurs> {
    const [missions, config] = await Promise.all([
      this.prisma.mission.findMany({
        select: {
          type: true,
          statut: true,
          dateFin: true,
          heures: true,
          montantHT: true,
          nbJours: true,
          clientOuProduction: true,
        },
      }),
      this.prisma.config.findUnique({ where: { id: 1 } }),
    ]);

    const missionsCalc: MissionCalc[] = missions;
    const configCalc: ConfigCalc = config ?? CONFIG_PAR_DEFAUT;

    return calculerIndicateurs(missionsCalc, configCalc, dateRef);
  }
}
