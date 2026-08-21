import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Ward } from '../entities/ward.entity';
import { Bed } from '../entities/bed.entity';
import { BedAllocation } from '../entities/bed-allocation.entity';
import { BedEquipment } from '../entities/bed-equipment.entity';
import { Clinic } from '../entities/clinic.entity';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { AllocateBedDto } from './dto/allocate-bed.dto';
import { DischargeBedDto } from './dto/discharge-bed.dto';
import { CreateBedEquipmentDto } from './dto/create-bed-equipment.dto';

@Injectable()
export class BedsService {
  constructor(
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Bed) private readonly bedRepo: Repository<Bed>,
    @InjectRepository(BedAllocation)
    private readonly allocRepo: Repository<BedAllocation>,
    @InjectRepository(BedEquipment)
    private readonly equipRepo: Repository<BedEquipment>,
    @InjectRepository(Clinic) private readonly clinicRepo: Repository<Clinic>,
  ) {}

  // ─── WARD MANAGEMENT ──────────────────────────────────────────────────────

  async createWard(clinicId: string, dto: CreateWardDto) {
    const clinic = await this.clinicRepo.findOne({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException('Clinic not found');

    const ward = this.wardRepo.create({
      clinic_id: clinicId,
      name: dto.name,
      ward_type: dto.ward_type ?? 'general',
      capacity: dto.capacity,
      floor: dto.floor ?? 1,
      description: dto.description,
      is_active: dto.is_active ?? true,
    });
    return this.wardRepo.save(ward);
  }

  async getWards(clinicId: string) {
    return this.wardRepo.find({
      where: { clinic_id: clinicId },
      relations: ['beds'],
      order: { floor: 'ASC', name: 'ASC' },
    });
  }

  async getWard(clinicId: string, wardId: string) {
    const ward = await this.wardRepo.findOne({
      where: { id: wardId, clinic_id: clinicId },
      relations: ['beds', 'beds.allocations', 'beds.allocations.patient'],
    });
    if (!ward) throw new NotFoundException('Ward not found');
    return ward;
  }

  async updateWard(clinicId: string, wardId: string, dto: UpdateWardDto) {
    const ward = await this.wardRepo.findOne({
      where: { id: wardId, clinic_id: clinicId },
    });
    if (!ward) throw new NotFoundException('Ward not found');

    Object.assign(ward, {
      name: dto.name ?? ward.name,
      ward_type: dto.ward_type ?? ward.ward_type,
      capacity: dto.capacity ?? ward.capacity,
      floor: dto.floor ?? ward.floor,
      description: dto.description ?? ward.description,
      is_active: dto.is_active ?? ward.is_active,
    });
    return this.wardRepo.save(ward);
  }

  async removeWard(clinicId: string, wardId: string) {
    const ward = await this.wardRepo.findOne({
      where: { id: wardId, clinic_id: clinicId },
    });
    if (!ward) throw new NotFoundException('Ward not found');
    await this.wardRepo.remove(ward);
    return { success: true };
  }

  // ─── BED MANAGEMENT ───────────────────────────────────────────────────────

  async createBed(clinicId: string, dto: CreateBedDto) {
    // Verify ward belongs to clinic
    const ward = await this.wardRepo.findOne({
      where: { id: dto.ward_id, clinic_id: clinicId },
    });
    if (!ward) throw new NotFoundException('Ward not found');

    // Check for duplicate bed number in same ward
    const existing = await this.bedRepo.findOne({
      where: { ward_id: dto.ward_id, bed_number: dto.bed_number },
    });
    if (existing)
      throw new BadRequestException('Bed number already exists in this ward');

    const bed = this.bedRepo.create({
      ward_id: dto.ward_id,
      bed_number: dto.bed_number,
      bed_type: dto.bed_type ?? 'standard',
      has_ventilator: dto.has_ventilator ?? false,
      has_cardiac_monitor: dto.has_cardiac_monitor ?? false,
      has_oxygen: dto.has_oxygen ?? false,
      is_isolation: dto.is_isolation ?? false,
      daily_rate: dto.daily_rate ?? 0,
      notes: dto.notes,
    });
    return this.bedRepo.save(bed);
  }

  async getBeds(clinicId: string, wardId?: string) {
    const where: FindOptionsWhere<Bed> = { ward: { clinic_id: clinicId } };
    if (wardId) where.ward_id = wardId;

    return this.bedRepo.find({
      where,
      relations: ['ward', 'allocations', 'equipment'],
      order: { bed_number: 'ASC' },
    });
  }

  async getBed(clinicId: string, bedId: string) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
      relations: ['ward', 'allocations', 'allocations.patient', 'equipment'],
    });
    if (!bed) throw new NotFoundException('Bed not found');
    return bed;
  }

  async updateBed(clinicId: string, bedId: string, dto: UpdateBedDto) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    Object.assign(bed, {
      bed_number: dto.bed_number ?? bed.bed_number,
      bed_type: dto.bed_type ?? bed.bed_type,
      has_ventilator: dto.has_ventilator ?? bed.has_ventilator,
      has_cardiac_monitor: dto.has_cardiac_monitor ?? bed.has_cardiac_monitor,
      has_oxygen: dto.has_oxygen ?? bed.has_oxygen,
      is_isolation: dto.is_isolation ?? bed.is_isolation,
      daily_rate: dto.daily_rate ?? bed.daily_rate,
      notes: dto.notes ?? bed.notes,
    });
    return this.bedRepo.save(bed);
  }

  async updateBedStatus(clinicId: string, bedId: string, status: string) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    const validStatuses = [
      'available',
      'occupied',
      'reserved',
      'maintenance',
      'cleaning',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    bed.status = status;
    return this.bedRepo.save(bed);
  }

  async removeBed(clinicId: string, bedId: string) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    // Check if bed has active allocations
    const activeAlloc = await this.allocRepo.findOne({
      where: { bed_id: bedId, status: 'active' },
    });
    if (activeAlloc)
      throw new BadRequestException(
        'Cannot remove bed with active patient allocation',
      );

    await this.bedRepo.remove(bed);
    return { success: true };
  }

  // ─── BED ALLOCATION ───────────────────────────────────────────────────────

  async allocateBed(clinicId: string, dto: AllocateBedDto) {
    // Verify bed belongs to clinic
    const bed = await this.bedRepo.findOne({
      where: { id: dto.bed_id, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    // Check bed is available
    if (bed.status !== 'available') {
      throw new BadRequestException(
        `Bed is not available (current status: ${bed.status})`,
      );
    }

    // Check for active allocation on this bed
    const existingAlloc = await this.allocRepo.findOne({
      where: { bed_id: dto.bed_id, status: 'active' },
    });
    if (existingAlloc)
      throw new BadRequestException('Bed already has an active allocation');

    const allocation = this.allocRepo.create({
      bed_id: dto.bed_id,
      patient_id: dto.patient_id,
      appointment_id: dto.appointment_id,
      expected_discharge: dto.expected_discharge
        ? new Date(dto.expected_discharge)
        : undefined,
      status: 'active',
    });
    const saved = await this.allocRepo.save(allocation);

    // Update bed status
    bed.status = 'occupied';
    await this.bedRepo.save(bed);

    return saved;
  }

  async dischargeBed(
    clinicId: string,
    allocationId: string,
    dto: DischargeBedDto,
  ) {
    const allocation = await this.allocRepo.findOne({
      where: { id: allocationId },
      relations: ['bed'],
    });
    if (!allocation) throw new NotFoundException('Allocation not found');

    // Verify bed belongs to clinic
    if (allocation.bed.ward?.clinic_id !== clinicId) {
      // Re-check with explicit query
      const bed = await this.bedRepo.findOne({
        where: { id: allocation.bed_id },
        relations: ['ward'],
      });
      if (!bed || bed.ward.clinic_id !== clinicId) {
        throw new ForbiddenException('Not your bed');
      }
    }

    if (allocation.status !== 'active') {
      throw new BadRequestException('Allocation is not active');
    }

    allocation.status = 'discharged';
    allocation.actual_discharge = new Date();
    allocation.discharge_notes = dto.discharge_notes ?? '';
    await this.allocRepo.save(allocation);

    // Update bed status to cleaning
    const bed = await this.bedRepo.findOne({
      where: { id: allocation.bed_id },
    });
    if (bed) {
      bed.status = 'cleaning';
      await this.bedRepo.save(bed);
    }

    return allocation;
  }

  async getActiveAllocations(clinicId: string) {
    return this.allocRepo.find({
      where: {
        bed: { ward: { clinic_id: clinicId } },
        status: 'active',
      },
      relations: ['bed', 'bed.ward', 'patient'],
      order: { admitted_at: 'DESC' },
    });
  }

  async getAllocationHistory(clinicId: string) {
    return this.allocRepo.find({
      where: {
        bed: { ward: { clinic_id: clinicId } },
      },
      relations: ['bed', 'bed.ward', 'patient'],
      order: { admitted_at: 'DESC' },
      take: 100,
    });
  }

  // ─── BED EQUIPMENT ────────────────────────────────────────────────────────

  async addEquipment(
    clinicId: string,
    bedId: string,
    dto: CreateBedEquipmentDto,
  ) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    const equipment = this.equipRepo.create({
      bed_id: bedId,
      equipment_type: dto.equipment_type,
      serial_number: dto.serial_number,
      last_maintenance: dto.last_maintenance,
      next_maintenance: dto.next_maintenance,
    });
    return this.equipRepo.save(equipment);
  }

  async getEquipment(clinicId: string, bedId: string) {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, ward: { clinic_id: clinicId } },
    });
    if (!bed) throw new NotFoundException('Bed not found');

    return this.equipRepo.find({
      where: { bed_id: bedId },
      order: { equipment_type: 'ASC' },
    });
  }

  async removeEquipment(clinicId: string, equipmentId: string) {
    const equip = await this.equipRepo.findOne({
      where: { id: equipmentId },
      relations: ['bed', 'bed.ward'],
    });
    if (!equip) throw new NotFoundException('Equipment not found');
    if (equip.bed.ward.clinic_id !== clinicId) {
      throw new ForbiddenException('Not your equipment');
    }
    await this.equipRepo.remove(equip);
    return { success: true };
  }

  // ─── DASHBOARD STATS ──────────────────────────────────────────────────────

  async getBedStats(clinicId: string) {
    const beds = await this.bedRepo.find({
      where: { ward: { clinic_id: clinicId } },
      relations: ['ward'],
    });

    const total = beds.length;
    const available = beds.filter((b) => b.status === 'available').length;
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    const reserved = beds.filter((b) => b.status === 'reserved').length;
    const maintenance = beds.filter((b) => b.status === 'maintenance').length;
    const cleaning = beds.filter((b) => b.status === 'cleaning').length;

    const urgent = beds.filter(
      (b) => b.ward.ward_type === 'emergency' && b.status === 'available',
    ).length;

    // Ward-wise breakdown
    const wards = await this.wardRepo.find({
      where: { clinic_id: clinicId },
      relations: ['beds'],
    });

    const wardBreakdown = wards.map((w) => ({
      ward_id: w.id,
      ward_name: w.name,
      ward_type: w.ward_type,
      capacity: w.capacity,
      total_beds: w.beds.length,
      available: w.beds.filter((b) => b.status === 'available').length,
      occupied: w.beds.filter((b) => b.status === 'occupied').length,
      reserved: w.beds.filter((b) => b.status === 'reserved').length,
      maintenance: w.beds.filter((b) => b.status === 'maintenance').length,
    }));

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      cleaning,
      urgent,
      occupancy_rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      wardBreakdown,
    };
  }

  // ─── BULK OPERATIONS ──────────────────────────────────────────────────────

  async bulkCreateBeds(
    clinicId: string,
    wardId: string,
    count: number,
    bedType: string = 'standard',
  ) {
    const ward = await this.wardRepo.findOne({
      where: { id: wardId, clinic_id: clinicId },
    });
    if (!ward) throw new NotFoundException('Ward not found');

    const beds: Bed[] = [];
    for (let i = 1; i <= count; i++) {
      const bedNumber = `${ward.name.charAt(0)}${String(i).padStart(3, '0')}`;
      const existing = await this.bedRepo.findOne({
        where: { ward_id: wardId, bed_number: bedNumber },
      });
      if (!existing) {
        const bed = this.bedRepo.create({
          ward_id: wardId,
          bed_number: bedNumber,
          bed_type: bedType,
          status: 'available',
        });
        beds.push(await this.bedRepo.save(bed));
      }
    }
    return beds;
  }
}
