import { StatutMission, TypeMission } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  titre!: string;

  @IsString()
  @IsNotEmpty()
  clientOuProduction!: string;

  @IsEnum(TypeMission)
  type!: TypeMission;

  @IsEnum(StatutMission)
  @IsOptional()
  statut?: StatutMission = StatutMission.PROPOSEE;

  @IsDateString()
  dateDebut!: string;

  @IsDateString()
  dateFin!: string;

  @IsString()
  @IsOptional()
  note?: string;

  // Intermittence
  @IsNumber()
  @Min(0)
  @IsOptional()
  heures?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  nbCachets?: number;

  // Freelance
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantHT?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  nbJours?: number;
}
