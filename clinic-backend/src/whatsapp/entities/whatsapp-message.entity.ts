import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from '../../entities/clinic.entity';
import { Patient } from '../../entities/patient.entity';
import { Appointment } from '../../entities/appointment.entity';

export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  BUTTON = 'button',
  INTERACTIVE = 'interactive',
  TEMPLATE = 'template',
  SYSTEM = 'system',
}

export enum WhatsAppMessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum WhatsAppMessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('whatsapp_messages')
@Index(['clinicId', 'createdAt'])
@Index(['patientId', 'createdAt'])
@Index(['waMessageId'])
export class WhatsAppMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id' })
  clinicId: string;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'patient_id', nullable: true })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'wa_message_id', unique: true })
  waMessageId: string;

  @Column({ name: 'wa_contact_id' })
  waContactId: string;

  @Column({
    type: 'enum',
    enum: WhatsAppMessageType,
    default: WhatsAppMessageType.TEXT,
  })
  type: WhatsAppMessageType;

  @Column({
    type: 'enum',
    enum: WhatsAppMessageDirection,
  })
  direction: WhatsAppMessageDirection;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: WhatsAppMessageStatus,
    default: WhatsAppMessageStatus.PENDING,
  })
  status: WhatsAppMessageStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}