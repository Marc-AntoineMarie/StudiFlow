import { TagProjet } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProjetDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsEnum(TagProjet)
  @IsOptional()
  tag?: TagProjet;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsUrl()
  @IsOptional()
  lienVideo?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  boiteProduction?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsOptional()
  clients?: string[];
}
