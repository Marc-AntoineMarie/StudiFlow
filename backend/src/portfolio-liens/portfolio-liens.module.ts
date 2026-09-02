import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PortfolioLiensService } from './portfolio-liens.service';
import { PortfolioLiensController } from './portfolio-liens.controller';

@Module({
  imports: [StorageModule],
  controllers: [PortfolioLiensController],
  providers: [PortfolioLiensService],
})
export class PortfolioLiensModule {}
