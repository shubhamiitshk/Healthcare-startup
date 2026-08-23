import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FollowUpService } from './followup.service';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { FollowUp } from './entities/followup.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';

@Controller('follow-ups')
@UseGuards(FirebaseAuthGuard)
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  async create(
    @ReqUser() _user: UserData,
    @Body() createFollowUpDto: CreateFollowUpDto,
  ): Promise<FollowUp> {
    return this.followUpService.create(createFollowUpDto);
  }

  @Get('patient/:patientId')
  async findByPatient(
    @ReqUser() _user: UserData,
    @Param('patientId') patientId: string,
  ): Promise<FollowUp[]> {
    return this.followUpService.findByPatient(patientId);
  }
}
