import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bed } from './bed.entity';

@Entity('bed_equipment')
export class BedEquipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bed_id', type: 'uuid' })
  bed_id: string;

  @ManyToOne(() => Bed, (bed) => bed.equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;

  @Column({ name: 'equipment_type', type: 'varchar' })
  equipment_type: string;

  @Column({ name: 'serial_number', type: 'varchar', nullable: true })
  serial_number: string;

  @Column({ type: 'varchar', default: 'functional' })
  status: string;

  @Column({ name: 'last_maintenance', type: 'date', nullable: true })
  last_maintenance: string;

  @Column({ name: 'next_maintenance', type: 'date', nullable: true })
  next_maintenance: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
