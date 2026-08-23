import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { LlmService, Intent } from './providers/llm.service';

interface CallSession {
  callerPhone: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
}

const FALLBACK_REPLY =
  'Sorry, I did not catch that. You can ask about your token status, book an appointment, or clinic timings.';

@Injectable()
export class AiReceptionistService {
  private readonly logger = new Logger(AiReceptionistService.name);
  private readonly sessions = new Map<string, CallSession>();

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(DoctorSchedule)
    private readonly schedRepo: Repository<DoctorSchedule>,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointments: AppointmentsService,
    private readonly llm: LlmService,
  ) {}

  startSession(callSid: string, callerPhone: string): CallSession {
    const session: CallSession = { callerPhone, history: [] };
    this.sessions.set(callSid, session);
    return session;
  }

  endSession(callSid: string): void {
    this.sessions.delete(callSid);
  }

  async handleUtterance(
    callSid: string,
    transcript: string,
    callerPhone?: string,
  ): Promise<{ replyText: string; intent: Intent }> {
    let session = this.sessions.get(callSid);
    if (!session) {
      session = this.startSession(callSid, callerPhone ?? 'unknown-caller');
    } else if (callerPhone && session.callerPhone === 'unknown-caller') {
      session.callerPhone = callerPhone;
    }
    session.history.push({ role: 'user', text: transcript });

    let replyText: string;
    const { intent, replyText: llmReply } = await this.llm.classify(transcript);

    switch (intent) {
      case Intent.CHECK_STATUS:
        replyText = await this.buildStatusReply(session.callerPhone);
        break;
      case Intent.BOOK_APPOINTMENT:
        replyText = await this.buildBookingReply(session.callerPhone, transcript);
        break;
      case Intent.FAQ:
        replyText = llmReply ?? FALLBACK_REPLY;
        break;
      default:
        replyText = FALLBACK_REPLY;
    }

    session.history.push({ role: 'assistant', text: replyText });
    return { replyText, intent };
  }

  private normalizePhone(raw: string): string | null {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length < 10) return null;
    return '+91' + digits.slice(-10);
  }

  private async findPatientByPhone(phone: string): Promise<Patient | null> {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return null;
    return this.patientRepo.findOne({ where: { phone_number: normalized } });
  }

  private async buildStatusReply(callerPhone: string): Promise<string> {
    try {
      const patient = await this.findPatientByPhone(callerPhone);
      if (!patient) {
        return 'I could not find a patient record for this number. Please register through the CatchQ app first.';
      }

      const list = await this.appointments.findForPatient(patient.id);
      const today = new Date().toISOString().slice(0, 10);
      const active = list.find(
        (a) => a.date === today && ['waiting', 'serving'].includes(String(a.status)),
      );

      if (!active) {
        return 'You have no active appointment today. Would you like to book one?';
      }
      if (active.status === 'serving') {
        return `The doctor is ready for you. Token number ${active.queueNumber}. Please proceed to the consultation room.`;
      }

      const ahead = await this.appointments.getPeopleAhead(active.id);
      if (ahead === 0) {
        return `You are next! Token number ${active.queueNumber}. Please be prepared.`;
      }
      const people = ahead === 1 ? 'is 1 person' : `are ${ahead} people`;
      return `Token number ${active.queueNumber}. There ${people} ahead of you. Estimated wait around ${ahead * 7} minutes.`;
    } catch (err) {
      this.logger.error(`Status lookup failed: ${err}`);
      return 'Sorry, I could not fetch your queue status right now. Please try again shortly.';
    }
  }

  private async buildBookingReply(
    callerPhone: string,
    utterance: string,
  ): Promise<string> {
    try {
      const patient = await this.findPatientByPhone(callerPhone);
      if (!patient) {
        return 'I could not find a patient record for this number. Please register through the CatchQ app first.';
      }

      const openSchedules = await this.openSchedulesToday();
      if (openSchedules.length === 0) {
        return 'There are no open slots left today. Please book through the CatchQ app for another day.';
      }

      const schedule = this.matchSpecialty(utterance, openSchedules) ?? openSchedules[0];

      await this.appointments.book(
        {
          scheduleId: schedule.id,
          date: new Date().toISOString().slice(0, 10),
          source: 'web',
        },
        patient.firebaseUid ?? patient.id,
      );

      const doctorName = schedule.doctor?.name;
      const from = schedule.start_time?.slice(0, 5);
      const to = schedule.end_time?.slice(0, 5);
      return `Booked for today with ${doctorName || 'the doctor'}, slot ${from} to ${to}. Your token details are in the CatchQ app.`;
    } catch (err) {
      if (err instanceof NotFoundException) {
        return 'That schedule is no longer available.';
      }
      this.logger.error(`Booking failed: ${err}`);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('fully booked')) {
        return 'That slot is fully booked today. Please try another day through the CatchQ app.';
      }
      if (msg.includes('already have an appointment')) {
        return 'You already have an appointment in that slot today.';
      }
      return 'Sorry, I could not complete the booking right now. Please use the CatchQ app or call again later.';
    }
  }

  private async openSchedulesToday(): Promise<DoctorSchedule[]> {
    const todayDow = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.schedRepo.find({
      where: { day_of_week: todayDow },
      relations: ['doctor'],
    });

    const open: DoctorSchedule[] = [];
    for (const sched of rows) {
      const total = await this.appointments.countBySchedule(sched.id, today);
      if ((sched.max_queue ?? 5) > total) open.push(sched);
    }
    return open;
  }

  private matchSpecialty(
    utterance: string,
    schedules: DoctorSchedule[],
  ): DoctorSchedule | null {
    const t = utterance.toLowerCase();
    for (const sched of schedules) {
      const spec = String((sched as any).doctor?.specialty ?? '').toLowerCase();
      if (spec && t.includes(spec)) return sched;
      const name = String((sched as any).doctor?.name ?? '').toLowerCase();
      if (name && t.includes(name)) return sched;
    }
    return null;
  }
}
