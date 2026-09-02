import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MissionsModule } from './missions/missions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ProjetsModule } from './projets/projets.module';
import { ParametresModule } from './parametres/parametres.module';
import { ExportModule } from './export/export.module';
import { RappelsModule } from './rappels/rappels.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), // limite globale par défaut ; /auth/login est plus stricte
    PrismaModule,
    AuthModule,
    MissionsModule,
    DashboardModule,
    DocumentsModule,
    ProjetsModule,
    ParametresModule,
    ExportModule,
    RappelsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
