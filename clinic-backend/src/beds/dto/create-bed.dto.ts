import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBedDto {
  @IsUUID()
  ward_id: string;

  @IsString()
  bed_number: string;

  @IsString()
  @IsOptional()
  bed_type?: string;

  @IsBoolean()
  @IsOptional()
  has_ventilator?: boolean;

  @IsBoolean()
  @IsOptional()
  has_cardiac_monitor?: boolean;

  @IsBoolean()
  @IsOptional()
  has_oxygen?: boolean;

  @IsBoolean()
  @IsOptional()
  is_isolation?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  daily_rate?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
