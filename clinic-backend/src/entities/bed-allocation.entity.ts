import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bed } from './bed.entity';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';

@Entity('bed_allocations')
export class BedAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bed_id', type: 'uuid' })
  bed_id: string;

  @ManyToOne(() => Bed, (bed) => bed.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;

  @Column({ name: 'patient_id', type: 'varchar', nullable: true })
  patient_id: string;

  @ManyToOne(() => Patient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointment_id: string;

  @ManyToOne(() => Appointment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'admitted_at', type: 'timestamptz', default: () => 'NOW()' })
  admitted_at: Date;

  @Column({ name: 'expected_discharge', type: 'timestamptz', nullable: true })
  expected_discharge: Date;

  @Column({ name: 'actual_discharge', type: 'timestamptz', nullable: true })
  actual_discharge: Date;

  @Column({ name: 'discharge_notes', type: 'text', nullable: true })
  discharge_notes: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
