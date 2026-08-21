import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueueService } from './queue.service';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';
import { CreateQueueDto } from './dto/create-queue.dto';

@Controller('doctors/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @UseGuards(AuthGuard('firebase'))
  async getQueue(@ReqUser() user: UserData) {
    return this.queueService.getDoctorsQueue(user.uid);
  }

  @Post()
  @UseGuards(AuthGuard('firebase'))
  async addToQueue(@Body() dto: CreateQueueDto) {
    return this.queueService.create(dto);
  }
}
