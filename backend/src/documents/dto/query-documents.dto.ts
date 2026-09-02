import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CategorieDocument } from '@prisma/client';

export class QueryDocumentsDto {
  @IsEnum(CategorieDocument)
  @IsOptional()
  categorie?: CategorieDocument;

  /** Id numérique en texte, ou "none" pour ne lister que les documents globaux. */
  @IsString()
  @IsOptional()
  missionId?: string;
}
