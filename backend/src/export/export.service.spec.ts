import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('ExportService', () => {
  const missions = [
    {
      id: 1,
      titre: 'Montage',
      clientOuProduction: 'Studio X',
      type: 'INTERMITTENCE',
      statut: 'TERMINEE',
      dateDebut: d('2026-01-05'),
      dateFin: d('2026-01-10'),
      heures: 24,
      montantHT: null,
      nbJours: null,
      note: null,
    },
  ];

  it('icsCalendrier : délègue à genererICS avec les missions triées', async () => {
    const prisma = { mission: { findMany: jest.fn().mockResolvedValue(missions) } };
    const service = new ExportService(prisma as unknown as PrismaService);

    const ics = await service.icsCalendrier();

    expect(prisma.mission.findMany).toHaveBeenCalledWith({ orderBy: { dateDebut: 'asc' } });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:mission-1@cadre.local');
  });

  it('csvMissions : délègue à genererCSV avec les missions triées', async () => {
    const prisma = { mission: { findMany: jest.fn().mockResolvedValue(missions) } };
    const service = new ExportService(prisma as unknown as PrismaService);

    const csv = await service.csvMissions();

    expect(csv).toContain('id;titre;client_production');
    expect(csv).toContain('Montage');
  });
});
