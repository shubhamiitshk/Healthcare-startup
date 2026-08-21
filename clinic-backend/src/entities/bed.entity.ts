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
import { Ward } from './ward.entity';
import { BedAllocation } from './bed-allocation.entity';
import { BedEquipment } from './bed-equipment.entity';

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ward_id', type: 'uuid' })
  ward_id: string;

  @ManyToOne(() => Ward, (ward) => ward.beds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;

  @Column({ name: 'bed_number', type: 'varchar' })
  bed_number: string;

  @Column({ name: 'bed_type', type: 'varchar', default: 'standard' })
  bed_type: string;

  @Column({ type: 'varchar', default: 'available' })
  status: string;

  @Column({ name: 'has_ventilator', type: 'boolean', default: false })
  has_ventilator: boolean;

  @Column({ name: 'has_cardiac_monitor', type: 'boolean', default: false })
  has_cardiac_monitor: boolean;

  @Column({ name: 'has_oxygen', type: 'boolean', default: false })
  has_oxygen: boolean;

  @Column({ name: 'is_isolation', type: 'boolean', default: false })
  is_isolation: boolean;

  @Column({ name: 'daily_rate', type: 'numeric', default: 0 })
  daily_rate: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => BedAllocation, (alloc) => alloc.bed)
  allocations: BedAllocation[];

  @OneToMany(() => BedEquipment, (equip) => equip.bed)
  equipment: BedEquipment[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
