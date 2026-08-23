import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum Intent {
  CHECK_STATUS = 'CHECK_STATUS',
  BOOK_APPOINTMENT = 'BOOK_APPOINTMENT',
  FAQ = 'FAQ',
  UNKNOWN = 'UNKNOWN',
}

export interface Classification {
  intent: Intent;
  replyText?: string;
  doctorName?: string;
  specialty?: string;
  preferredDay?: string;
  preferredDate?: string;
  confidence?: number;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY'));
  }

  async classify(
    utterance: string,
    history: ConversationTurn[] = [],
    clinicContext = '',
  ): Promise<Classification> {
    if (!this.enabled) return this.ruleBased(utterance);

    try {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      const systemPrompt = [
        'You are the intelligent voice AI receptionist for CatchQ Clinic & Healthcare Management.',
        'Your goal is to parse patient spoken requests on the phone accurately and warmly.',
        '',
        'CLINIC CONTEXT & DOCTORS AVAILABLE:',
        clinicContext || 'Standard multispecialty clinic with General Physician, Pediatrician, and Dentists.',
        '',
        'INTENT CATEGORIES:',
        '1. CHECK_STATUS: asking about their token number, queue position, estimated wait time, or active appointment today.',
        '2. BOOK_APPOINTMENT: wants to book, schedule, or see a doctor. Extract any mentioned doctor name, medical specialty, or day/date.',
        '3. FAQ: general inquiries regarding clinic timings, fees, address/directions, emergency services, or available specialties.',
        '4. UNKNOWN: unintelligible or unrelated utterances.',
        '',
        'RESPONSE FORMAT: Respond ONLY with a valid JSON object matching this schema:',
        '{',
        '  "intent": "CHECK_STATUS" | "BOOK_APPOINTMENT" | "FAQ" | "UNKNOWN",',
        '  "replyText": "short conversational voice response if FAQ (max 30 words)",',
        '  "doctorName": "extracted doctor name or null",',
        '  "specialty": "extracted specialty like General Physician, Pediatrician, or null",',
        '  "preferredDay": "monday|tuesday|wednesday|thursday|friday|saturday|sunday or null",',
        '  "confidence": 0.0 to 1.0',
        '}',
      ].join('\n');

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add recent conversation history (up to last 6 turns)
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        messages.push({
          role: turn.role === 'user' ? 'user' : 'assistant',
          content: turn.text,
        });
      }

      messages.push({ role: 'user', content: utterance });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages,
        }),
      });

      if (!res.ok) throw new Error(`status ${res.status}`);

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      const intent = String(parsed.intent ?? '').toUpperCase() as Intent;

      if (Object.values(Intent).includes(intent)) {
        return {
          intent,
          replyText: parsed.replyText,
          doctorName: parsed.doctorName || undefined,
          specialty: parsed.specialty || undefined,
          preferredDay: parsed.preferredDay || undefined,
          confidence: parsed.confidence ?? 0.95,
        };
      }
      return { intent: Intent.UNKNOWN };
    } catch (err) {
      this.logger.warn(`LLM classification failed, falling back to rule-based parser: ${err}`);
      return this.ruleBased(utterance);
    }
  }

  private ruleBased(text: string): Classification {
    const t = text.toLowerCase();

    // 1. Status Check
    if (/(token|queue|turn|waiting|wait time|how long|position|status|ahead|my number)/.test(t)) {
      return { intent: Intent.CHECK_STATUS, confidence: 0.9 };
    }

    // 2. FAQ (clinic hours, fees, address, location, directions)
    if (/(timing|open|close|hours|fee|charge|cost|price|address|location|where|direction)/.test(t)) {
      let replyText = 'Our clinic is open Monday through Saturday from 9 AM to 5 PM. Consultations start from $50.';
      if (/(fee|charge|cost|price)/.test(t)) {
        replyText = 'General consultation fee is $50. Specialized consultations range between $60 and $80.';
      } else if (/(address|location|where|direction)/.test(t)) {
        replyText = 'We are located at 100 Medical Center Blvd, Suite 200. CatchQ appointments can be tracked live in our app.';
      }

      return {
        intent: Intent.FAQ,
        replyText,
        confidence: 0.9,
      };
    }

    // 3. Book Appointment
    if (/(book|appointment|schedule|consult|doctor|dr\.|visit|see a doc)/.test(t)) {
      let doctorName: string | undefined;
      let specialty: string | undefined;

      if (/sarah|jenkins/.test(t)) doctorName = 'Dr. Sarah Jenkins';
      else if (/michael|chen/.test(t)) doctorName = 'Dr. Michael Chen';

      if (/pediatric|child|baby/.test(t)) specialty = 'Pediatrician';
      else if (/physician|fever|cough|general/.test(t)) specialty = 'General Physician';
      else if (/heart|cardio/.test(t)) specialty = 'Cardiologist';
      else if (/skin|derma/.test(t)) specialty = 'Dermatologist';

      return {
        intent: Intent.BOOK_APPOINTMENT,
        doctorName,
        specialty,
        confidence: 0.85,
      };
    }

    return { intent: Intent.UNKNOWN, confidence: 0.5 };
  }
}
