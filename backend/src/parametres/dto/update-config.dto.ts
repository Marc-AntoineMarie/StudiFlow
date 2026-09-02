import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Tous les paramètres métier (seuil, fenêtre, journée type, heures/cachet) sont
 * modifiables ici — jamais codés en dur ailleurs dans l'app (cf. AGENTS.md §3.6).
 */
export class UpdateConfigDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  seuilHeures?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  dureeFenetreMois?: number;

  @IsNumber()
  @Min(0.5)
  @IsOptional()
  journeeTypeHeures?: number;

  @IsNumber()
  @Min(0.5)
  @IsOptional()
  heuresParCachet?: number;
}
