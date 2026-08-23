import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiReceptionistController } from './ai-receptionist.controller';
import { AiReceptionistService } from './ai-receptionist.service';
import { SttService } from './providers/stt.service';
import { LlmService } from './providers/llm.service';
import { TtsService } from './providers/tts.service';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Doctor, DoctorSchedule]),
    AppointmentsModule,
  ],
  controllers: [AiReceptionistController],
  providers: [AiReceptionistService, SttService, LlmService, TtsService],
  exports: [AiReceptionistService, SttService, LlmService, TtsService],
})
export class AiReceptionistModule {}
