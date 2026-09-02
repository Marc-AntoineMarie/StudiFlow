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
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { ProjetsService } from './projets.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { QueryProjetsDto } from './dto/query-projets.dto';

const TAILLE_MAX_VIDEO_OCTETS = 150 * 1024 * 1024; // 150 Mo

@Controller('projets')
export class ProjetsController {
  constructor(
    private readonly projetsService: ProjetsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  create(@Body() dto: CreateProjetDto) {
    return this.projetsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryProjetsDto) {
    return this.projetsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjetDto) {
    return this.projetsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.projetsService.remove(id);
  }

  @Post(':id/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: TAILLE_MAX_VIDEO_OCTETS },
    }),
  )
  uploaderVideo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projetsService.uploaderVideo(id, file);
  }

  @Delete(':id/video')
  supprimerVideo(@Param('id', ParseIntPipe) id: number) {
    return this.projetsService.supprimerVideo(id);
  }

  /**
   * Lecture de la vidéo hébergée, réservée au propriétaire connecté. Marquée
   * @Public() car un <video src="..."> ne peut pas poser de header
   * Authorization — le jeton est donc vérifié manuellement ici, passé en
   * `?token=` (pattern standard pour les ressources <video>/<img> protégées).
   * Le lien public d'un portfolio utilise une route séparée, scoping différent
   * (cf. PortfolioLiensController).
   */
  @Public()
  @Get(':id/video')
  async lireVideo(
    @Param('id', ParseIntPipe) id: number,
    @Query('token') token: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.verifierJeton(token);
    const projet = await this.projetsService.findOne(id);
    if (!projet.videoStockageNom || !projet.videoMimeType) {
      res.status(404).send();
      return;
    }
    await this.projetsService.streamerVideo(projet.videoStockageNom, projet.videoMimeType, req, res);
  }

  /** Même logique que lireVideo, pour la vignette générée (best-effort côté service). */
  @Public()
  @Get(':id/video-thumbnail')
  async lireMiniatureVideo(
    @Param('id', ParseIntPipe) id: number,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    await this.verifierJeton(token);
    const chemin = await this.projetsService.cheminMiniatureVideo(id);
    if (!chemin) {
      res.status(404).send();
      return;
    }
    res.download(chemin, 'apercu');
  }

  private async verifierJeton(token: string | undefined): Promise<JwtPayload> {
    if (!token) throw new UnauthorizedException('Jeton manquant');
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
  }
}
