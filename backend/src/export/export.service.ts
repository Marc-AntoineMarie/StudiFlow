import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { genererICS } from './ics';
import { genererCSV } from './csv';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async icsCalendrier(): Promise<string> {
    const missions = await this.prisma.mission.findMany({ orderBy: { dateDebut: 'asc' } });
    return genererICS(missions);
  }

  async csvMissions(): Promise<string> {
    const missions = await this.prisma.mission.findMany({ orderBy: { dateDebut: 'asc' } });
    return genererCSV(missions);
  }
}
