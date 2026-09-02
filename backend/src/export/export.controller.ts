import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

// Construit via code point plutôt qu'un caractère littéral dans le fichier :
// le BOM est invisible et se prête mal à être collé/édité de manière fiable.
const BOM_UTF8 = String.fromCharCode(0xfeff);

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('calendar.ics')
  async calendarIcs(@Res() res: Response) {
    const contenu = await this.exportService.icsCalendrier();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cadre-missions.ics"');
    res.send(contenu);
  }

  @Get('missions.csv')
  async missionsCsv(@Res() res: Response) {
    const contenu = await this.exportService.csvMissions();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cadre-missions.csv"');
    // BOM UTF-8 explicite : Excel détecte l'encodage correctement (accents, €).
    res.send(BOM_UTF8 + contenu);
  }
}
