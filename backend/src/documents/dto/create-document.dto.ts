import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CategorieDocument } from '@prisma/client';

/** Les champs de formulaire arrivent en `multipart/form-data` à côté du fichier. */
export class CreateDocumentDto {
  @IsEnum(CategorieDocument)
  categorie!: CategorieDocument;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  missionId?: number;
}
