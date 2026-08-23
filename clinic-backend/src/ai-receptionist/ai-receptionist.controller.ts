import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Body,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as path from 'path';
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
    const baseName = path.basename(file);
    return `${base}/api/ai-receptionist/audio/${baseName}`;
  }

  /** GET /api/ai-receptionist/health — check status of Voice, STT, LLM, TTS */
  @Get('health')
  health() {
    return {
      status: 'online',
      stt: { enabled: this.stt.enabled, provider: 'OpenAI Whisper' },
      llm: { provider: 'OpenAI GPT-4o-mini / CatchQ Rule Engine' },
      tts: { enabled: this.tts.enabled, provider: 'ElevenLabs / Polly Fallback' },
      twilio: {
        configured: Boolean(
          this.config.get('TWILIO_ACCOUNT_SID') &&
            this.config.get('TWILIO_AUTH_TOKEN'),
        ),
      },
    };
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
    const callSid = body.CallSid || `turn-${Date.now()}`;
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
          '<Say voice="Polly.Aditi">Sorry, I could not hear you clearly. Please speak after the tone.</Say>' +
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

  /** POST /api/ai-receptionist/simulate-turn — interactive voice & text simulator */
  @Post('simulate-turn')
  async simulateTurn(
    @Body()
    body: {
      phone?: string;
      text?: string;
      audioBase64?: string;
      sessionId?: string;
    },
  ) {
    const callerPhone = body.phone || '+919876543210';
    const sessionId = body.sessionId || `sim-${Date.now()}`;
    let transcript = (body.text || '').trim();

    if (!transcript && body.audioBase64) {
      transcript = await this.stt.transcribeBase64(body.audioBase64);
    }

    if (!transcript) {
      return {
        success: false,
        message: 'No text or intelligible audio provided for simulation.',
      };
    }

    const { replyText, intent, data } = await this.ai.handleUtterance(
      sessionId,
      transcript,
      callerPhone,
    );

    let audioUrl: string | null = null;
    const audioFile = await this.tts.synthesizeToFile(replyText);
    if (audioFile) {
      audioUrl = this.publicAudioUrl(audioFile);
    }

    return {
      success: true,
      sessionId,
      transcript,
      intent,
      replyText,
      audioUrl,
      audioFile: audioFile ? path.basename(audioFile) : null,
      data,
    };
  }

  /** POST /api/ai-receptionist/synthesize — Direct TTS text-to-speech */
  @Post('synthesize')
  async synthesize(@Body('text') text: string) {
    if (!text) {
      return { success: false, message: 'Text is required' };
    }
    const audioFile = await this.tts.synthesizeToFile(text);
    return {
      success: Boolean(audioFile),
      audioUrl: audioFile ? this.publicAudioUrl(audioFile) : null,
      file: audioFile ? path.basename(audioFile) : null,
    };
  }

  /** POST /api/ai-receptionist/transcribe — Direct STT speech-to-text */
  @Post('transcribe')
  async transcribe(@Body('audioBase64') audioBase64: string) {
    if (!audioBase64) {
      return { success: false, message: 'audioBase64 is required' };
    }
    const text = await this.stt.transcribeBase64(audioBase64);
    return { success: true, text };
  }

  /** GET /api/ai-receptionist/audio/:file — serves generated TTS clips once */
  @Get('audio/:file')
  serveAudio(@Param('file') file: string, @Res() res: Response): void {
    const resolved = this.tts.resolve(file);
    if (!resolved) {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'Audio file not found' });
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
