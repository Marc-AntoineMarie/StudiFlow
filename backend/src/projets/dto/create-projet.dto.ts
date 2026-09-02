import { TagProjet } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

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

  /** Optionnel : une vidéo hébergée peut être ajoutée après coup (POST /:id/video). */
  @IsUrl()
  @IsOptional()
  lienVideo?: string; // domaine YouTube/Vimeo vérifié dans le service

  /** Optionnel : le monteur n'a pas toujours de boîte de prod à citer. */
  @IsString()
  @MaxLength(200)
  @IsOptional()
  boiteProduction?: string;

  /** Optionnel : ajoutés un par un côté frontend, stockés comme une simple liste. */
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsOptional()
  clients?: string[];
}
