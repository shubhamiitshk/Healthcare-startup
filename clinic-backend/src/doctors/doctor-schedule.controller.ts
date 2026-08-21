import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('schedules')
@UseGuards(FirebaseAuthGuard)
export class DoctorScheduleController {
  constructor(private readonly svc: DoctorScheduleService) {}

  @Post()
  create(@Body() dto: CreateDoctorScheduleDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorScheduleDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
