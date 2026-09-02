import { TagProjet } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** '' → undefined : le frontend envoie parfois une chaîne vide pour "pas de lien
 * externe" (cas vidéo hébergée) — @IsOptional() ne l'accepte pas telle quelle
 * (seul `undefined` saute la validation, pas ''), d'où ce nettoyage en amont. */
const videoVideEnUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

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

  @Transform(videoVideEnUndefined)
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
