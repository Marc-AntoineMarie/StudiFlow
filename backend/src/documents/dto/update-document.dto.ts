import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

/**
 * Rattacher/détacher un document existant à une mission après coup (dépôt initial
 * en dépôt global, ou changement d'avis). `missionId: null` = détacher (retour au
 * dépôt global) ; `missionId` absent = pas de changement.
 */
export class UpdateDocumentDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  missionId?: number | null;
}
