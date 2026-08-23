import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AiReceptionistService } from './ai-receptionist.service';
import { SttService } from './providers/stt.service';
import { TtsService } from './providers/tts.service';
import { decodeMuLaw, createWavContainer } from './utils/mulaw.util';

interface StreamSession {
  streamSid?: string;
  callSid?: string;
  callerPhone?: string;
  audioChunks: Buffer[];
  isProcessing: boolean;
}

@WebSocketGateway({
  namespace: '/voice-stream',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class VoiceStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: any;

  private readonly logger = new Logger(VoiceStreamGateway.name);
  private readonly streamSessions = new Map<string, StreamSession>();

  constructor(
    private readonly ai: AiReceptionistService,
    private readonly stt: SttService,
    private readonly tts: TtsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Twilio Voice Media Stream connected: ${client.id}`);
    this.streamSessions.set(client.id, {
      audioChunks: [],
      isProcessing: false,
    });

    client.on('message', async (data: string | object) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        await this.handleTwilioMessage(client, msg);
      } catch (err) {
        this.logger.error(`Error processing stream message: ${err}`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Twilio Voice Media Stream disconnected: ${client.id}`);
    const session = this.streamSessions.get(client.id);
    if (session?.callSid) {
      this.ai.endSession(session.callSid);
    }
    this.streamSessions.delete(client.id);
  }

  private async handleTwilioMessage(client: Socket, msg: any) {
    const session = this.streamSessions.get(client.id);
    if (!session) return;

    switch (msg.event) {
      case 'start':
        session.streamSid = msg.start?.streamSid;
        session.callSid = msg.start?.callSid;
        session.callerPhone = msg.start?.customParameters?.callerPhone || '+919876543210';
        this.logger.log(
          `Stream started: streamSid=${session.streamSid}, callSid=${session.callSid}`,
        );
        break;

      case 'media':
        if (msg.media?.payload) {
          const rawMuLaw = Buffer.from(msg.media.payload, 'base64');
          session.audioChunks.push(rawMuLaw);
        }
        break;

      case 'stop':
        this.logger.log(`Stream stopped for ${client.id}`);
        await this.processCollectedAudio(client, session);
        break;

      case 'mark':
        this.logger.debug(`Twilio mark received: ${msg.mark?.name}`);
        break;
    }
  }

  /**
   * Processes buffered mu-law audio chunks through Whisper STT, LLM Intent, and TTS
   */
  async processCollectedAudio(client: Socket, session: StreamSession) {
    if (session.audioChunks.length === 0 || session.isProcessing) return;
    session.isProcessing = true;

    try {
      const combinedMuLaw = Buffer.concat(session.audioChunks);
      session.audioChunks = []; // Reset buffer for next speech segment

      // Convert 8kHz mu-law into standard 16-bit linear PCM WAV container
      const pcm16 = decodeMuLaw(combinedMuLaw);
      const wavContainer = createWavContainer(pcm16, 8000, 1);

      // 1. Transcribe via Whisper
      const transcript = await this.stt.transcribe(wavContainer, 'audio/wav');
      if (!transcript) {
        session.isProcessing = false;
        return;
      }

      this.logger.log(`[Stream Speech] Transcribed: "${transcript}"`);

      // 2. Classify & Execute Intent
      const callSid = session.callSid || `stream-${client.id}`;
      const { replyText, intent, data } = await this.ai.handleUtterance(
        callSid,
        transcript,
        session.callerPhone,
      );

      this.logger.log(`[Stream Intent] ${intent} -> "${replyText}"`);

      // 3. Emit confirmation back to client stream
      client.emit('ai-response', {
        streamSid: session.streamSid,
        transcript,
        intent,
        replyText,
        data,
      });
    } catch (err) {
      this.logger.error(`Stream audio processing failed: ${err}`);
    } finally {
      session.isProcessing = false;
    }
  }
}
