import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService], // réutilisé par rappels/ pour la jauge d'heures
})
export class DashboardModule {}
