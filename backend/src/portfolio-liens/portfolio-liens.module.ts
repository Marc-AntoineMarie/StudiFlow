import { Module } from '@nestjs/common';
import { PortfolioLiensService } from './portfolio-liens.service';
import { PortfolioLiensController } from './portfolio-liens.controller';

@Module({
  controllers: [PortfolioLiensController],
  providers: [PortfolioLiensService],
})
export class PortfolioLiensModule {}
