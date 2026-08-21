import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateWardDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  ward_type?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsInt()
  @IsOptional()
  floor?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
