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
}

const SYSTEM_PROMPT = [
  'You are the AI receptionist for CatchQ clinics.',
  'Classify the caller utterance into exactly one intent:',
  '- CHECK_STATUS: asking about their token, turn, queue position, wait time or current appointment.',
  '- BOOK_APPOINTMENT: wants to book, schedule or reschedule an appointment.',
  '- FAQ: clinic timings, location, fees or general questions.',
  'For FAQ include a short friendly replyText (max 30 words).',
  'Respond ONLY with minified JSON: {"intent":"CHECK_STATUS|BOOK_APPOINTMENT|FAQ|UNKNOWN"} plus "replyText" when intent is FAQ.',
].join('\n');

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY'));
  }

  async classify(utterance: string): Promise<Classification> {
    if (!this.enabled) return this.ruleBased(utterance);

    try {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: utterance },
          ],
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      const intent = String(parsed.intent ?? '').toUpperCase();

      if (
        intent === Intent.CHECK_STATUS ||
        intent === Intent.BOOK_APPOINTMENT
      ) {
        return { intent };
      }
      if (intent === Intent.FAQ && typeof parsed.replyText === 'string') {
        return { intent: Intent.FAQ, replyText: parsed.replyText };
      }
      return { intent: Intent.UNKNOWN };
    } catch (err) {
      this.logger.warn(`LLM classification failed, using rules: ${err}`);
      return this.ruleBased(utterance);
    }
  }

  private ruleBased(text: string): Classification {
    const t = text.toLowerCase();
    if (/(token|queue|turn|waiting|wait time|how long|position|status|ahead)/.test(t)) {
      return { intent: Intent.CHECK_STATUS };
    }
    if (/(book|make an appointment|new appointment|schedule an?|reschedul|visit the doctor)/.test(t)) {
      return { intent: Intent.BOOK_APPOINTMENT };
    }
    if (/(timing|open|close|hours|fee|charge|address|location|where)/.test(t)) {
      return {
        intent: Intent.FAQ,
        replyText:
          'Clinic hours and fees vary by doctor. You can browse doctors and available slots anytime in the CatchQ app.',
      };
    }
    return { intent: Intent.UNKNOWN };
  }
}
