import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Body,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AiReceptionistService } from './ai-receptionist.service';
import { SttService } from './providers/stt.service';
import { TtsService } from './providers/tts.service';

const GREETING =
  'Hello! Thank you for calling CatchQ clinic. You can ask about your token status, book an appointment, or clinic timings. Please speak after the beep.';

@Controller('ai-receptionist')
export class AiReceptionistController {
  private readonly logger = new Logger(AiReceptionistController.name);

  constructor(
    private readonly ai: AiReceptionistService,
    private readonly stt: SttService,
    private readonly tts: TtsService,
    private readonly config: ConfigService,
  ) {}

  private xml(res: Response, twiml: string): Response {
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response>${twiml}</Response>`);
  }

  private recordBlock(): string {
    return (
      '<Record action="/api/ai-receptionist/voice/recording" ' +
      'method="POST" maxLength="12" playBeep="true" transcribe="false" timeout="3"/>'
    );
  }

  private publicAudioUrl(file: string): string {
    const base =
      this.config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3001';
    return `${base}/api/ai-receptionist/audio/${file}`;
  }

  /** POST /api/ai-receptionist/voice/incoming — Twilio answers & prompts caller */
  @Post('voice/incoming')
  incoming(@Res() res: Response) {
    const say = this.tts.enabled
      ? `<Say>${GREETING}</Say>`
      : `<Say voice="Polly.Aditi">${GREETING}</Say>`;
    return this.xml(res, say + this.recordBlock());
  }

  /** POST /api/ai-receptionist/voice/recording — Whisper → LLM → ElevenLabs loop */
  @Post('voice/recording')
  async recording(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ): Promise<Response> {
    const callSid = body.CallSid;
    const callerPhone = body.From ?? '';
    const recordingUrl = body.RecordingUrl;

    if (!recordingUrl) {
      return this.xml(res, this.recordBlock());
    }

    try {
      const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
      const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
      const media = await fetch(`${recordingUrl}.wav`, {
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        },
      });

      let transcript = '';
      if (media.ok && this.stt.enabled) {
        const bytes = Buffer.from(await media.arrayBuffer());
        transcript = await this.stt.transcribe(bytes, 'audio/wav');
      } else if (!this.stt.enabled) {
        this.logger.warn('OPENAI_API_KEY not configured; skipping transcription');
      }

      if (!transcript) {
        return this.xml(
          res,
          '<Say voice="Polly.Aditi">Sorry, I could not hear you.</Say>' +
            this.recordBlock(),
        );
      }

      this.ai.startSession(callSid, callerPhone);
      const { replyText } = await this.ai.handleUtterance(
        callSid,
        transcript,
        callerPhone,
      );

      const audioFile = await this.tts.synthesizeToFile(replyText);
      const speak = audioFile
        ? `<Play>${this.publicAudioUrl(audioFile)}</Play>`
        : `<Say voice="Polly.Aditi">${this.escapeXml(replyText)}</Say>`;

      return this.xml(res, speak + this.recordBlock());
    } catch (err) {
      this.logger.error(`Voice turn failed: ${err}`);
      return this.xml(
        res,
        '<Say voice="Polly.Aditi">Something went wrong. Please call again later.</Say>',
      );
    }
  }

  /** GET /api/ai-receptionist/audio/:file — serves generated TTS clips once */
  @Get('audio/:file')
  serveAudio(@Param('file') file: string, @Res() res: Response): void {
    const resolved = this.tts.resolve(file);
    if (!resolved) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.type('audio/mpeg').sendFile(resolved, (err) => {
      this.tts.consume(file);
      if (err) this.logger.warn(`Audio serve failed: ${err.message}`);
    });
  }

  /** POST /api/ai-receptionist/voice/status — cleanup when call ends */
  @Post('voice/status')
  status(@Body() body: Record<string, string>, @Res() res: Response) {
    if (body.CallSid) this.ai.endSession(body.CallSid);
    return res.status(204).send();
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
