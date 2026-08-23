import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly outDir = path.join(os.tmpdir(), 'catchq-tts');

  constructor(private readonly config: ConfigService) {
    fs.mkdirSync(this.outDir, { recursive: true });
  }

  get enabled(): boolean {
    return Boolean(this.config.get<string>('ELEVENLABS_API_KEY'));
  }

  async synthesizeToFile(text: string): Promise<string | null> {
    const apiKey = this.config.get<string>('ELEVENLABS_API_KEY') ?? '';
    const voiceId =
      this.config.get<string>('ELEVENLABS_VOICE_ID') || DEFAULT_VOICE_ID;

    if (!this.enabled) {
      this.logger.debug('ELEVENLABS_API_KEY not configured, skipping ElevenLabs TTS');
      return null;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: this.config.get('ELEVENLABS_MODEL_ID') || 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.4, similarity_boost: 0.75 },
        }),
      });
    } catch (err) {
      this.logger.error(`ElevenLabs request failed: ${err}`);
      return null;
    }

    if (!res.ok) {
      this.logger.error(`ElevenLabs error ${res.status}: ${await res.text()}`);
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const fileName = `${randomUUID()}.mp3`;
    const fullPath = path.join(this.outDir, fileName);
    fs.writeFileSync(fullPath, buf);
    return fileName;
  }

  async synthesizeToBuffer(text: string): Promise<Buffer | null> {
    const apiKey = this.config.get<string>('ELEVENLABS_API_KEY') ?? '';
    const voiceId =
      this.config.get<string>('ELEVENLABS_VOICE_ID') || DEFAULT_VOICE_ID;

    if (!this.enabled) {
      return null;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: this.config.get('ELEVENLABS_MODEL_ID') || 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.4, similarity_boost: 0.75 },
        }),
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this.logger.error(`ElevenLabs buffer synthesis failed: ${err}`);
      return null;
    }
  }

  resolve(file: string): string | null {
    const base = path.basename(file);
    const resolved = path.resolve(this.outDir, base);
    if (!resolved.startsWith(this.outDir) || !fs.existsSync(resolved)) {
      return null;
    }
    return resolved;
  }

  consume(file: string): void {
    try {
      const base = path.basename(file);
      const filePath = path.join(this.outDir, base);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      /* already gone */
    }
  }
}
