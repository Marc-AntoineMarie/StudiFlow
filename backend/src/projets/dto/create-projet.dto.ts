import { TagProjet } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateProjetDto {
  @IsString()
  @IsNotEmpty()
  titre!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(TagProjet)
  tag!: TagProjet;

  @IsDateString()
  date!: string;

  @IsUrl()
  lienVideo!: string; // domaine YouTube/Vimeo vérifié dans le service
}
