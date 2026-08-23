import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY'));
  }

  async transcribe(
    audio: Buffer,
    mimeType = 'audio/wav',
    filename = 'call.wav',
    language?: string,
  ): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set; returning empty transcript');
      return '';
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(audio)], { type: mimeType }),
      filename,
    );
    form.append('model', 'whisper-1');
    if (language) {
      form.append('language', language);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Whisper transcription failed (${res.status}): ${body}`);
        return '';
      }

      const data = (await res.json()) as { text?: string };
      return (data.text ?? '').trim();
    } catch (err) {
      this.logger.error(`Whisper STT request error: ${err}`);
      return '';
    }
  }

  async transcribeBase64(
    base64Audio: string,
    mimeType = 'audio/wav',
    language?: string,
  ): Promise<string> {
    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    return this.transcribe(buffer, mimeType, 'recording.wav', language);
  }
}
