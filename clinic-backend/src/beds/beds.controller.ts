import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BedsService } from './beds.service';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { AllocateBedDto } from './dto/allocate-bed.dto';
import { DischargeBedDto } from './dto/discharge-bed.dto';
import { CreateBedEquipmentDto } from './dto/create-bed-equipment.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';

@Controller('beds')
@UseGuards(FirebaseAuthGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  // ─── WARD ENDPOINTS ─────────────────────────────────────────────────────

  /** POST /api/beds/wards  → Create a new ward */
  @Post('wards')
  async createWard(@ReqUser() user: UserData, @Body() dto: CreateWardDto) {
    return this.bedsService.createWard(user.uid, dto);
  }

  /** GET /api/beds/wards  → List all wards for clinic */
  @Get('wards')
  async getWards(@ReqUser() user: UserData) {
    return this.bedsService.getWards(user.uid);
  }

  /** GET /api/beds/wards/:id  → Get ward with beds */
  @Get('wards/:id')
  async getWard(@ReqUser() user: UserData, @Param('id') wardId: string) {
    return this.bedsService.getWard(user.uid, wardId);
  }

  /** PATCH /api/beds/wards/:id  → Update ward */
  @Patch('wards/:id')
  async updateWard(
    @ReqUser() user: UserData,
    @Param('id') wardId: string,
    @Body() dto: UpdateWardDto,
  ) {
    return this.bedsService.updateWard(user.uid, wardId, dto);
  }

  /** DELETE /api/beds/wards/:id  → Remove ward */
  @Delete('wards/:id')
  async removeWard(@ReqUser() user: UserData, @Param('id') wardId: string) {
    return this.bedsService.removeWard(user.uid, wardId);
  }

  // ─── BED ENDPOINTS ──────────────────────────────────────────────────────

  /** POST /api/beds  → Create a new bed */
  @Post()
  async createBed(@ReqUser() user: UserData, @Body() dto: CreateBedDto) {
    return this.bedsService.createBed(user.uid, dto);
  }

  /** GET /api/beds  → List all beds (optionally filter by ward) */
  @Get()
  async getBeds(@ReqUser() user: UserData, @Query('ward_id') wardId?: string) {
    return this.bedsService.getBeds(user.uid, wardId);
  }

  /** GET /api/beds/:id  → Get single bed with allocations */
  @Get(':id')
  async getBed(@ReqUser() user: UserData, @Param('id') bedId: string) {
    return this.bedsService.getBed(user.uid, bedId);
  }

  /** PATCH /api/beds/:id  → Update bed details */
  @Patch(':id')
  async updateBed(
    @ReqUser() user: UserData,
    @Param('id') bedId: string,
    @Body() dto: UpdateBedDto,
  ) {
    return this.bedsService.updateBed(user.uid, bedId, dto);
  }

  /** PATCH /api/beds/:id/status  → Update bed status */
  @Patch(':id/status')
  async updateBedStatus(
    @ReqUser() user: UserData,
    @Param('id') bedId: string,
    @Body('status') status: string,
  ) {
    return this.bedsService.updateBedStatus(user.uid, bedId, status);
  }

  /** DELETE /api/beds/:id  → Remove bed */
  @Delete(':id')
  async removeBed(@ReqUser() user: UserData, @Param('id') bedId: string) {
    return this.bedsService.removeBed(user.uid, bedId);
  }

  /** POST /api/beds/:id/bulk  → Bulk create beds in a ward */
  @Post(':id/bulk')
  async bulkCreateBeds(
    @ReqUser() user: UserData,
    @Param('id') wardId: string,
    @Body('count') count: number,
    @Body('bed_type') bedType?: string,
  ) {
    return this.bedsService.bulkCreateBeds(user.uid, wardId, count, bedType);
  }

  // ─── ALLOCATION ENDPOINTS ────────────────────────────────────────────────

  /** POST /api/beds/allocate  → Allocate patient to bed */
  @Post('allocate')
  async allocateBed(@ReqUser() user: UserData, @Body() dto: AllocateBedDto) {
    return this.bedsService.allocateBed(user.uid, dto);
  }

  /** PATCH /api/beds/allocate/:id/discharge  → Discharge patient from bed */
  @Patch('allocate/:id/discharge')
  async dischargeBed(
    @ReqUser() user: UserData,
    @Param('id') allocationId: string,
    @Body() dto: DischargeBedDto,
  ) {
    return this.bedsService.dischargeBed(user.uid, allocationId, dto);
  }

  /** GET /api/beds/allocations/active  → Get all active allocations */
  @Get('allocations/active')
  async getActiveAllocations(@ReqUser() user: UserData) {
    return this.bedsService.getActiveAllocations(user.uid);
  }

  /** GET /api/beds/allocations/history  → Get allocation history */
  @Get('allocations/history')
  async getAllocationHistory(@ReqUser() user: UserData) {
    return this.bedsService.getAllocationHistory(user.uid);
  }

  // ─── EQUIPMENT ENDPOINTS ─────────────────────────────────────────────────

  /** POST /api/beds/:id/equipment  → Add equipment to bed */
  @Post(':id/equipment')
  async addEquipment(
    @ReqUser() user: UserData,
    @Param('id') bedId: string,
    @Body() dto: CreateBedEquipmentDto,
  ) {
    return this.bedsService.addEquipment(user.uid, bedId, dto);
  }

  /** GET /api/beds/:id/equipment  → List equipment for bed */
  @Get(':id/equipment')
  async getEquipment(@ReqUser() user: UserData, @Param('id') bedId: string) {
    return this.bedsService.getEquipment(user.uid, bedId);
  }

  /** DELETE /api/beds/equipment/:id  → Remove equipment */
  @Delete('equipment/:id')
  async removeEquipment(
    @ReqUser() user: UserData,
    @Param('id') equipmentId: string,
  ) {
    return this.bedsService.removeEquipment(user.uid, equipmentId);
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────

  /** GET /api/beds/stats  → Get bed statistics for dashboard */
  @Get('stats/dashboard')
  async getBedStats(@ReqUser() user: UserData) {
    return this.bedsService.getBedStats(user.uid);
  }
}
