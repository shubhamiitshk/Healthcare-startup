import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Bed } from './bed.entity';

@Entity('wards')
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id', type: 'varchar' })
  clinic_id: string;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'ward_type', type: 'varchar', default: 'general' })
  ward_type: string;

  @Column({ type: 'int', default: 10 })
  capacity: number;

  @Column({ type: 'int', default: 1 })
  floor: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Bed, (bed) => bed.ward)
  beds: Bed[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
