import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsAppMessageType } from '../entities/whatsapp-message.entity';

export class InteractiveButton {
  @IsString()
  type: 'reply';

  @IsString()
  reply: {
    id: string;
    title: string;
  };
}

export class InteractiveListSection {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractiveListRow)
  rows: InteractiveListRow[];
}

export class InteractiveListRow {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class InteractiveAction {
  @IsString()
  @IsEnum(['button', 'list'])
  type: 'button' | 'list';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractiveButton)
  buttons?: InteractiveButton[];

  @IsOptional()
  @IsString()
  button?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractiveListSection)
  sections?: InteractiveListSection[];
}

export class InteractiveMessage {
  @IsString()
  type: 'interactive';

  @IsObject()
  @ValidateNested()
  @Type(() => InteractiveAction)
  interactive: {
    type: 'button' | 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: InteractiveAction;
  };
}

export class TemplateComponent {
  @IsString()
  type: 'header' | 'body' | 'footer' | 'button';

  @IsOptional()
  @IsArray()
  parameters: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: { fallback_value: string; code: string; amount_1000: number };
    date_time?: { fallback_value: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    video?: { link: string };
  }>;
}

export class TemplateMessage {
  @IsString()
  name: string;

  @IsObject()
  language: { code: string; policy?: 'deterministic' };

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponent)
  components?: TemplateComponent[];
}

export class SendMessageDto {
  @IsString()
  to: string;

  @IsEnum(WhatsAppMessageType)
  type: WhatsAppMessageType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InteractiveMessage)
  interactive?: InteractiveMessage;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TemplateMessage)
  template?: TemplateMessage;

  @IsOptional()
  @IsObject()
  media?: {
    link: string;
    caption?: string;
    filename?: string;
  };

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}