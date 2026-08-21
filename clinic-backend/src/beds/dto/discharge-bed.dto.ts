import { IsString, IsOptional } from 'class-validator';

export class DischargeBedDto {
  @IsString()
  @IsOptional()
  discharge_notes?: string;
}
