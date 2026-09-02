import { Module } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { ProjetsController } from './projets.controller';

@Module({
  controllers: [ProjetsController],
  providers: [ProjetsService],
})
export class ProjetsModule {}
