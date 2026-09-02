import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';

const TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: TAILLE_MAX_OCTETS },
    }),
  )
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(file, dto);
  }

  @Get()
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { chemin, nomFichier } = await this.documentsService.getCheminTelechargement(id);
    res.download(chemin, nomFichier);
  }

  @Get(':id/thumbnail')
  async thumbnail(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const miniature = await this.documentsService.getMiniature(id);
    if (!miniature) {
      res.status(404).send();
      return;
    }
    res.setHeader('Content-Type', miniature.mimeType);
    res.download(miniature.chemin, 'apercu');
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.documentsService.remove(id);
  }
}
