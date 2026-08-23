import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { QueueModule } from './queue/queue.module';
import { DoctorsModule } from './doctors/doctors.module';
import { BedsModule } from './beds/beds.module';
import { AiReceptionistModule } from './ai-receptionist/ai-receptionist.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WhatsAppMessage } from './whatsapp/entities/whatsapp-message.entity';
import { Invoice } from './entities/invoice.entity';
import { BillingModule } from './billing/billing.module';
import { Clinic } from './entities/clinic.entity';
import { Doctor } from './entities/doctor.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Patient } from './entities/patient.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Appointment } from './entities/appointment.entity';
import { FollowUp } from './appointments/entities/followup.entity';
import { Ward } from './entities/ward.entity';
import { Bed } from './entities/bed.entity';
import { BedAllocation } from './entities/bed-allocation.entity';
import { BedEquipment } from './entities/bed-equipment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get('DATABASE_URL'),
        entities: [
          Clinic,
          Doctor,
          DoctorSchedule,
          Patient,
          FamilyMember,
          Appointment,
          FollowUp,
          Ward,
          Bed,
          BedAllocation,
          BedEquipment,
          WhatsAppMessage,
          Invoice,
        ],
        autoLoadEntities: true,
        synchronize: false,
        ssl:
          cfg.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
          max: 20,
          connectionTimeoutMillis: 10000,
          query_timeout: 10000,
          statement_timeout: 10000,
        },
        retryAttempts: 10,
        retryDelay: 10000,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Doctor,
      DoctorSchedule,
      Clinic,
      Patient,
      FamilyMember,
      Appointment,
      FollowUp,
      Ward,
      Bed,
      BedAllocation,
      BedEquipment,
      WhatsAppMessage,
      Invoice,
    ]),
    GatewayModule,
    AuthModule,
    ClinicsModule,
    PatientsModule,
    AppointmentsModule,
    QueueModule,
    DoctorsModule,
    BedsModule,
    AiReceptionistModule,
    WhatsappModule,
    BillingModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
