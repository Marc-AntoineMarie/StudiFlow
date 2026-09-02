import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { RappelsService } from './rappels.service';
import { RappelsController } from './rappels.controller';

@Module({
  imports: [DashboardModule],
  controllers: [RappelsController],
  providers: [RappelsService],
})
export class RappelsModule {}
