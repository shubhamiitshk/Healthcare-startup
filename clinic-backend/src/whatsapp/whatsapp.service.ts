import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WhatsAppMessage as WhatsAppMessageEntity,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from './entities/whatsapp-message.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(WhatsAppMessageEntity)
    private readonly messageRepo: Repository<WhatsAppMessageEntity>,
    private readonly config: ConfigService,
  ) {}

  get enabled(): boolean {
    return Boolean(
      this.config.get<string>('WHATSAPP_ACCESS_TOKEN') &&
        this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID'),
    );
  }

  private endpoint(): string {
    const version =
      this.config.get<string>('WHATSAPP_API_VERSION') || 'v20.0';
    return `https://graph.facebook.com/${version}/${this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')}/messages`;
  }

  private buildPayload(dto: SendMessageDto): Record<string, unknown> {
    const base: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: dto.to,
      type: dto.type,
    };

    switch (dto.type) {
      case WhatsAppMessageType.TEXT:
        base.text = { preview_url: true, body: dto.text ?? '' };
        break;
      case WhatsAppMessageType.TEMPLATE:
        base.template = dto.template;
        break;
      case WhatsAppMessageType.INTERACTIVE:
        base.interactive = dto.interactive;
        break;
      case WhatsAppMessageType.IMAGE:
      case WhatsAppMessageType.VIDEO:
      case WhatsAppMessageType.DOCUMENT:
        base[dto.type] = dto.media;
        break;
      default:
        base.text = { body: dto.text ?? '' };
    }
    return base;
  }

  async send(
    dto: SendMessageDto,
    clinicId?: string,
  ): Promise<WhatsAppMessageEntity> {
    const entity = this.messageRepo.create({
      clinicId: clinicId ?? 'system',
      patientId: dto.patientId,
      appointmentId: dto.appointmentId,
      waContactId: dto.to,
      type: dto.type,
      direction: WhatsAppMessageDirection.OUTBOUND,
      content: dto.text ?? null,
      metadata: {
        interactive: dto.interactive ?? null,
        template: dto.template ?? null,
        media: dto.media ?? null,
      },
      status: WhatsAppMessageStatus.PENDING,
    });

    if (!this.enabled) {
      this.logger.warn(
        `WhatsApp not configured; skipping send to ${dto.to}: ${dto.text?.slice(0, 60)}`,
      );
      entity.status = WhatsAppMessageStatus.FAILED;
      entity.errorMessage = 'WhatsApp credentials not configured';
      return this.messageRepo.save(entity);
    }

    try {
      const res = await fetch(this.endpoint(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.get<string>('WHATSAPP_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildPayload(dto)),
      });
      const data = (await res.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string };
      };

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }
      entity.waMessageId = data.messages?.[0]?.id ?? `local-${Date.now()}`;
      entity.status = WhatsAppMessageStatus.SENT;
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${err}`);
      entity.waMessageId = `failed-${Date.now()}`;
      entity.status = WhatsAppMessageStatus.FAILED;
      entity.errorMessage = err instanceof Error ? err.message : String(err);
    }

    return this.messageRepo.save(entity);
  }

  async sendText(to: string, text: string, context?: { patientId?: string; appointmentId?: string }): Promise<WhatsAppMessageEntity> {
    return this.send({ to, type: WhatsAppMessageType.TEXT, text, ...context });
  }

  async markStatus(waMessageId: string, status: string, errorMessage?: string): Promise<void> {
    const mapped =
      status === 'delivered'
        ? WhatsAppMessageStatus.DELIVERED
        : status === 'read'
          ? WhatsAppMessageStatus.READ
          : status === 'failed'
            ? WhatsAppMessageStatus.FAILED
            : null;
    if (!mapped) return;
    await this.messageRepo.update(
      { waMessageId },
      { status: mapped, errorMessage: errorMessage ?? null },
    );
  }

  async recordInbound(payload: {
    from: string;
    waMessageId: string;
    type: string;
    text?: string;
    phoneNumberId?: string;
  }): Promise<void> {
    const entity = this.messageRepo.create({
      clinicId: 'system',
      waContactId: payload.from,
      waMessageId: payload.waMessageId,
      type: WhatsAppMessageType.TEXT,
      direction: WhatsAppMessageDirection.INBOUND,
      content: payload.text ?? `[${payload.type}]`,
      status: WhatsAppMessageStatus.SENT,
    });
    await this.messageRepo.save(entity);
  }

  async historyForContact(contact: string): Promise<WhatsAppMessageEntity[]> {
    return this.messageRepo.find({
      where: { waContactId: contact },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
