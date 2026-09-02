import { TagProjet } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryProjetsDto {
  @IsEnum(TagProjet)
  @IsOptional()
  tag?: TagProjet;
}
