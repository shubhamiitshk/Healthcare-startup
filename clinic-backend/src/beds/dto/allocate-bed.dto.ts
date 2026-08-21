import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class AllocateBedDto {
  @IsUUID()
  bed_id: string;

  @IsString()
  @IsOptional()
  patient_id?: string;

  @IsUUID()
  @IsOptional()
  appointment_id?: string;

  @IsDateString()
  @IsOptional()
  expected_discharge?: string;
}
