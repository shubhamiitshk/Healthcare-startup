import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsAppWebhookPayload } from './dto/whatsapp-webhook.dto';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  /** GET /api/whatsapp/webhook — Meta subscription verification handshake */
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token && token === expected) {
      return challenge;
    }
    throw new UnauthorizedException('Verification failed');
  }

  /** POST /api/whatsapp/webhook — inbound messages & delivery statuses */
  @Post('webhook')
  async receive(@Body() payload: WhatsAppWebhookPayload): Promise<{ received: boolean }> {
    try {
      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          for (const msg of change.value?.messages ?? []) {
            await this.whatsapp.recordInbound({
              from: msg.from,
              waMessageId: msg.id,
              type: msg.type,
              text: msg.text?.body,
            });
          }
          for (const st of change.value?.statuses ?? []) {
            await this.whatsapp.markStatus(st.id, st.status, st.errors?.[0]?.message);
          }
        }
      }
    } catch (err) {
      this.logger.error(`Webhook processing failed: ${err}`);
    }
    return { received: true };
  }

  /** GET /api/whatsapp/history/:contact — recent thread for a phone number */
  @Get('history')
  history(@Query('contact') contact: string) {
    return { success: true, data: this.whatsapp.historyForContact(contact) };
  }
}
