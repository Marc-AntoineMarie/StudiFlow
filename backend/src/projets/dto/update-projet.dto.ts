import { TagProjet } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

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
}
