import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async create(clinicId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = this.invoiceRepo.create({
      clinicId,
      patientId: dto.patientId ?? null,
      appointmentId: dto.appointmentId ?? null,
      date: dto.date,
      amount: dto.amount,
      discount: dto.discount ?? 0,
      paymentMode: dto.paymentMode ?? 'cash',
      status: dto.status ?? 'unpaid',
      notes: dto.notes,
    });
    return this.invoiceRepo.save(invoice);
  }

  async findAll(
    clinicId: string,
    filters: { date?: string; status?: string; search?: string },
  ): Promise<Invoice[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.patient', 'patient')
      .leftJoinAndSelect('invoice.appointment', 'appointment')
      .where('invoice.clinic_id = :clinicId', { clinicId })
      .orderBy('invoice.date', 'DESC')
      .addOrderBy('invoice.created_at', 'DESC');

    if (filters.date) {
      qb.andWhere('invoice.date = :date', { date: filters.date });
    }
    if (filters.status && filters.status !== 'all') {
      qb.andWhere('invoice.status = :status', { status: filters.status });
    }
    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(patient.full_name) LIKE :term OR patient.phone_number LIKE :term OR CAST(invoice.amount AS TEXT) LIKE :term)`,
        { term },
      );
    }
    return qb.getMany();
  }

  async markPaid(clinicId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['clinic'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.clinicId !== clinicId) throw new ForbiddenException();

    invoice.status = 'paid' as InvoiceStatus;
    return this.invoiceRepo.save(invoice);
  }

  async remove(clinicId: string, invoiceId: string): Promise<{ success: boolean }> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.clinicId !== clinicId) throw new ForbiddenException();
    await this.invoiceRepo.remove(invoice);
    return { success: true };
  }

  async summary(clinicId: string, date?: string): Promise<{
    totalBilled: number;
    collected: number;
    pending: number;
    count: number;
  }> {
    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.clinic_id = :clinicId', { clinicId });
    if (date) qb.andWhere('invoice.date = :date', { date });

    const rows = await qb.getMany();
    const net = (i: Invoice) => Number(i.amount) - Number(i.discount ?? 0);
    const paid = rows.filter((i) => i.status === 'paid');

    return {
      totalBilled: rows.reduce((s, i) => s + net(i), 0),
      collected: paid.reduce((s, i) => s + net(i), 0),
      pending: rows
        .filter((i) => i.status === 'unpaid')
        .reduce((s, i) => s + net(i), 0),
      count: rows.length,
    };
  }
}
