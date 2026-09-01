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

/** Tous les champs sont optionnels : mise à jour partielle. */
export class UpdateMissionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  clientOuProduction?: string;

  @IsEnum(TypeMission)
  @IsOptional()
  type?: TypeMission;

  @IsEnum(StatutMission)
  @IsOptional()
  statut?: StatutMission;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  heures?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  nbCachets?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montantHT?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  nbJours?: number;
}
