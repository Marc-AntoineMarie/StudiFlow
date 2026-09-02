import { ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateLienDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  titre?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(1, { each: true })
  projetIds!: number[];
}
