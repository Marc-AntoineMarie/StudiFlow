import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { ProjetsService } from './projets.service';
import { ProjetsController } from './projets.controller';

@Module({
  imports: [StorageModule, AuthModule],
  controllers: [ProjetsController],
  providers: [ProjetsService],
})
export class ProjetsModule {}
