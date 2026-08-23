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
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { LlmService, Intent, Classification } from './providers/llm.service';
import { v4 as uuidv4 } from 'uuid';

export interface CallSession {
  callerPhone: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
}

const FALLBACK_REPLY =
  'Sorry, I did not catch that. You can ask about your queue status, book an appointment with a doctor, or clinic timings.';

@Injectable()
export class AiReceptionistService {
  private readonly logger = new Logger(AiReceptionistService.name);
  private readonly sessions = new Map<string, CallSession>();

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
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
  ): Promise<{ replyText: string; intent: Intent; data?: any }> {
    let session = this.sessions.get(callSid);
    if (!session) {
      session = this.startSession(callSid, callerPhone ?? '+919876543210');
    } else if (callerPhone && session.callerPhone === 'unknown-caller') {
      session.callerPhone = callerPhone;
    }
    session.history.push({ role: 'user', text: transcript });

    const clinicContext = await this.buildClinicContext();
    const classification = await this.llm.classify(
      transcript,
      session.history,
      clinicContext,
    );

    let replyText: string;
    let data: any = null;

    switch (classification.intent) {
      case Intent.CHECK_STATUS: {
        const res = await this.buildStatusReply(session.callerPhone);
        replyText = res.text;
        data = res.data;
        break;
      }
      case Intent.BOOK_APPOINTMENT: {
        const res = await this.buildBookingReply(
          session.callerPhone,
          transcript,
          classification,
        );
        replyText = res.text;
        data = res.data;
        break;
      }
      case Intent.FAQ:
        replyText = classification.replyText ?? FALLBACK_REPLY;
        break;
      default:
        replyText = FALLBACK_REPLY;
    }

    session.history.push({ role: 'assistant', text: replyText });
    return { replyText, intent: classification.intent, data };
  }

  private normalizePhone(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length < 10) return '+919876543210';
    return '+91' + digits.slice(-10);
  }

  private async getOrCreatePatient(phone: string): Promise<Patient> {
    const normalized = this.normalizePhone(phone);
    let patient = await this.patientRepo.findOne({
      where: { phone_number: normalized },
    });
    if (!patient) {
      const newId = uuidv4();
      patient = this.patientRepo.create({
        id: newId,
        phone_number: normalized,
        fullName: `Caller (${normalized.slice(-4)})`,
        isProfileComplete: false,
      });
      patient = await this.patientRepo.save(patient);
      this.logger.log(`Created guest patient record for voice caller: ${normalized}`);
    }
    return patient;
  }

  private async buildClinicContext(): Promise<string> {
    try {
      const doctors = await this.doctorRepo.find({
        relations: ['schedules', 'clinic'],
      });
      if (!doctors.length) return '';

      const lines = doctors.map((d) => {
        const days = Array.from(
          new Set(d.schedules?.map((s) => s.day_of_week) || []),
        ).join(', ');
        return `- ${d.name} (${d.specialty}), available on: ${days || 'Weekdays'}, Clinic: ${d.clinic?.name || 'Central Health'}`;
      });
      return lines.join('\n');
    } catch {
      return '';
    }
  }

  private async buildStatusReply(
    callerPhone: string,
  ): Promise<{ text: string; data?: any }> {
    try {
      const patient = await this.getOrCreatePatient(callerPhone);
      const list = await this.appointments.findForPatient(patient.id);
      const today = new Date().toISOString().slice(0, 10);
      const active = list.find(
        (a) =>
          a.date === today && ['waiting', 'serving'].includes(String(a.status)),
      );

      if (!active) {
        return {
          text: `You do not have an active appointment for today. Would you like me to book one with Dr. Sarah Jenkins or Dr. Michael Chen?`,
          data: { hasActiveAppointment: false },
        };
      }

      if (active.status === 'serving') {
        return {
          text: `Doctor is ready for you now! Your token number is ${active.queueNumber}. Please proceed to the consultation room.`,
          data: { status: 'serving', queueNumber: active.queueNumber },
        };
      }

      const ahead = await this.appointments.getPeopleAhead(active.id);
      if (ahead === 0) {
        return {
          text: `You are next in line! Your token is number ${active.queueNumber}. Please stay near the room.`,
          data: { status: 'waiting', queueNumber: active.queueNumber, peopleAhead: 0 },
        };
      }

      const peopleText = ahead === 1 ? 'is 1 person' : `are ${ahead} people`;
      const estMinutes = ahead * 7;
      return {
        text: `Your token number is ${active.queueNumber}. There ${peopleText} ahead of you. Estimated wait is about ${estMinutes} minutes.`,
        data: {
          status: 'waiting',
          queueNumber: active.queueNumber,
          peopleAhead: ahead,
          estimatedWaitMinutes: estMinutes,
        },
      };
    } catch (err) {
      this.logger.error(`Status lookup error: ${err}`);
      return {
        text: 'Sorry, I could not fetch your queue status right now. Please try again shortly.',
      };
    }
  }

  private async buildBookingReply(
    callerPhone: string,
    utterance: string,
    classification: Classification,
  ): Promise<{ text: string; data?: any }> {
    try {
      const patient = await this.getOrCreatePatient(callerPhone);
      const openSchedules = await this.openSchedulesToday();

      if (openSchedules.length === 0) {
        return {
          text: 'All consultation slots are currently full for today. You can view upcoming availability on the CatchQ mobile app.',
          data: { booked: false, reason: 'fully_booked' },
        };
      }

      let schedule: DoctorSchedule | null = null;

      // 1. Try matching with LLM extracted doctor or specialty
      if (classification.doctorName || classification.specialty) {
        schedule = this.matchDoctorOrSpecialty(
          classification.doctorName,
          classification.specialty,
          openSchedules,
        );
      }

      // 2. Fallback to keyword matching in utterance
      if (!schedule) {
        schedule = this.matchSpecialty(utterance, openSchedules);
      }

      // 3. Fallback to first available schedule
      if (!schedule) {
        schedule = openSchedules[0];
      }

      const today = new Date().toISOString().slice(0, 10);
      const booking = await this.appointments.book(
        {
          scheduleId: schedule.id,
          date: today,
          source: 'voice_ai',
        },
        patient.firebaseUid ?? patient.id,
      );

      const doctorName = schedule.doctor?.name || 'the doctor';
      const fromTime = schedule.start_time?.slice(0, 5) || '09:00';
      const toTime = schedule.end_time?.slice(0, 5) || '17:00';

      return {
        text: `Confirmed! I have booked your appointment with ${doctorName} for today, between ${fromTime} and ${toTime}. Your token number is ${booking.queueNumber}.`,
        data: {
          booked: true,
          queueNumber: booking.queueNumber,
          doctorName,
          appointmentId: booking.id,
          date: today,
        },
      };
    } catch (err) {
      this.logger.error(`Voice booking failed: ${err}`);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already have an appointment')) {
        return {
          text: 'You already have an active appointment scheduled for today in this slot.',
          data: { booked: false, error: 'duplicate' },
        };
      }
      if (msg.includes('fully booked')) {
        return {
          text: 'That doctor is fully booked for today. Would you like me to check other available doctors?',
          data: { booked: false, error: 'slot_full' },
        };
      }
      return {
        text: 'Sorry, I could not complete the booking right now. Please book directly via the CatchQ app or call back in a moment.',
        data: { booked: false, error: msg },
      };
    }
  }

  private async openSchedulesToday(): Promise<DoctorSchedule[]> {
    const todayDow = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.schedRepo.find({
      where: [
        { day_of_week: todayDow },
        { day_of_week: todayDow.toLowerCase() },
      ],
      relations: ['doctor'],
    });

    const open: DoctorSchedule[] = [];
    for (const sched of rows) {
      const total = await this.appointments.countBySchedule(sched.id, today);
      if ((sched.max_queue ?? 15) > total) open.push(sched);
    }
    return open;
  }

  private matchDoctorOrSpecialty(
    doctorName?: string,
    specialty?: string,
    schedules: DoctorSchedule[] = [],
  ): DoctorSchedule | null {
    if (doctorName) {
      const target = doctorName.toLowerCase();
      const match = schedules.find((s) =>
        s.doctor?.name?.toLowerCase().includes(target),
      );
      if (match) return match;
    }
    if (specialty) {
      const target = specialty.toLowerCase();
      const match = schedules.find((s) =>
        s.doctor?.specialty?.toLowerCase().includes(target),
      );
      if (match) return match;
    }
    return null;
  }

  private matchSpecialty(
    utterance: string,
    schedules: DoctorSchedule[],
  ): DoctorSchedule | null {
    const t = utterance.toLowerCase();
    for (const sched of schedules) {
      const spec = String(sched.doctor?.specialty ?? '').toLowerCase();
      if (spec && t.includes(spec)) return sched;
      const name = String(sched.doctor?.name ?? '').toLowerCase();
      if (name && t.includes(name)) return sched;
    }
    return null;
  }
}
