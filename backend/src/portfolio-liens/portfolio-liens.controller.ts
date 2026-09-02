import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PortfolioLiensService } from './portfolio-liens.service';
import { CreateLienDto } from './dto/create-lien.dto';

@Controller('portfolio-liens')
export class PortfolioLiensController {
  constructor(private readonly portfolioLiensService: PortfolioLiensService) {}

  @Post()
  create(@Body() dto: CreateLienDto) {
    return this.portfolioLiensService.create(dto);
  }

  @Get()
  findAll() {
    return this.portfolioLiensService.findAll();
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.portfolioLiensService.remove(id);
  }

  // Route publique, sans JWT : c'est la page consultée par le client final.
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':token/public')
  resoudrePublic(@Param('token') token: string) {
    return this.portfolioLiensService.resoudrePublic(token);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':token/video/:projetId')
  streamerVideo(
    @Param('token') token: string,
    @Param('projetId', ParseIntPipe) projetId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.portfolioLiensService.streamerVideoPublique(token, projetId, req, res);
  }
}
