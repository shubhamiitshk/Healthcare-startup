import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from './entities/followup.entity';
import { Patient } from '../entities/patient.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class FollowUpReminderService {
  private readonly logger = new Logger(FollowUpReminderService.name);

  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly whatsapp: WhatsappService,
  ) {}

  // Runs every day at 8am
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendReminders(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const followUps = await this.followUpRepository.find({
      where: { date: today },
    });
    this.logger.log(`Dispatching ${followUps.length} follow-up reminders`);

    for (const followUp of followUps) {
      const message = `Reminder: you have a follow-up appointment today at ${followUp.time}. Reason: ${followUp.reason}.`;
      try {
        const patient = await this.patientRepo.findOne({
          where: { id: followUp.patientId },
        });
        if (!patient?.phone_number) {
          this.logger.warn(
            `No contact for patient ${followUp.patientId}; skipping reminder`,
          );
          continue;
        }
        const result = await this.whatsapp.sendText(
          patient.phone_number,
          message,
          { patientId: patient.id },
        );
        this.logger.log(
          `Reminder for patient ${followUp.patientId}: ${result.status}`,
        );
      } catch (err) {
        this.logger.error(
          `Reminder dispatch failed for ${followUp.patientId}: ${err}`,
        );
      }
    }
  }
}
