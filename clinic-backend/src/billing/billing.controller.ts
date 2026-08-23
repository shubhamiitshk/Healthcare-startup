import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';

@Controller('invoices')
@UseGuards(FirebaseAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post()
  create(@ReqUser() user: UserData, @Body() dto: CreateInvoiceDto) {
    return this.billing.create(user.uid, dto);
  }

  @Get()
  findAll(
    @ReqUser() user: UserData,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.billing.findAll(user.uid, { date, status, search });
  }

  @Get('summary')
  summary(@ReqUser() user: UserData, @Query('date') date?: string) {
    return this.billing.summary(user.uid, date);
  }

  @Patch(':id/pay')
  markPaid(@ReqUser() user: UserData, @Param('id') id: string) {
    return this.billing.markPaid(user.uid, id);
  }

  @Delete(':id')
  remove(@ReqUser() user: UserData, @Param('id') id: string) {
    return this.billing.remove(user.uid, id);
  }
}
