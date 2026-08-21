import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateBedEquipmentDto {
  @IsString()
  equipment_type: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsDateString()
  @IsOptional()
  last_maintenance?: string;

  @IsDateString()
  @IsOptional()
  next_maintenance?: string;
}
