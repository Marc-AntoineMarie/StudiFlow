import { StatutMission, TypeMission } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryMissionsDto {
  @IsEnum(TypeMission)
  @IsOptional()
  type?: TypeMission;

  @IsEnum(StatutMission)
  @IsOptional()
  statut?: StatutMission;
}
