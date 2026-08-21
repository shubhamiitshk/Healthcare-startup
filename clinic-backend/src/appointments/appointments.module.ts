// src/appointments/appointments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { FollowUpController } from './followup.controller';
import { FollowUpService } from './followup.service';
import { FollowUpReminderService } from './followup-reminder.service';

import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { FollowUp } from './entities/followup.entity';
import { GatewayModule } from '../gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Patient,
      FamilyMember,
      DoctorSchedule,
      FollowUp,
    ]),
    forwardRef(() => GatewayModule),
  ],
  controllers: [AppointmentsController, FollowUpController],
  providers: [AppointmentsService, FollowUpService, FollowUpReminderService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
