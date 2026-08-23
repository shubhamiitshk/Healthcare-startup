import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY'));
  }

  async transcribe(audio: Buffer, mimeType = 'audio/wav'): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(audio)], { type: mimeType }),
      'call.wav',
    );
    form.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Whisper transcription failed (${res.status}): ${body}`);
      throw new Error('STT_FAILED');
    }

    const data = (await res.json()) as { text?: string };
    return (data.text ?? '').trim();
  }
}
