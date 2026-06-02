import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ImportarObraDto {
  @IsString()
  titulo: string;

  @IsString()
  portada_url: string;

  @IsString()
  mangadex_id: string;

  @IsNumber()
  @IsOptional()
  total_tomos?: number;

  @IsString()
  @IsOptional()
  estado?: string;
}