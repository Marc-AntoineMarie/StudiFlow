import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';
import { genererRecapitulatifPdf } from './pdf-recapitulatif';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  create(@Body() dto: CreateMissionDto) {
    return this.missionsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryMissionsDto) {
    return this.missionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOne(id);
  }

  @Get(':id/recapitulatif.pdf')
  async recapitulatifPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const mission = await this.missionsService.findOne(id);
    const pdf = await genererRecapitulatifPdf(mission);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="mission-${id}-recapitulatif.pdf"`);
    res.send(pdf);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMissionDto) {
    return this.missionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.missionsService.remove(id);
  }
}
