import { IsUUID, IsDateString, IsNumber, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { InvoiceStatus } from '../../entities/invoice.entity';

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsIn(['cash', 'card', 'upi', 'netbanking'])
  paymentMode?: string;

  @IsOptional()
  @IsIn(['paid', 'unpaid', 'cancelled'])
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
