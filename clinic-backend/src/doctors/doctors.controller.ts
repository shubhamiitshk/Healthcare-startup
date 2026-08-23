import { QueueService } from '../queue/queue.service';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';

@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly queueService: QueueService,
  ) {}

  //
  // ─── PUBLIC ───────────────────────────────────────────────────────────────────
  //
    /** GET /api/doctors/public  → returns all doctors (for your mobile "browse" screen) */
    @Get('public')
    async findAllPublic() {
        return this.doctorsService.findAllPublic();
    }

    // NOTE: GET /api/doctors/queue is served by QueueController (queue.module)
    // to avoid a duplicate-route conflict that silently shadowed one handler.

  //
  // ─── PROTECTED (all write & clinic-scoped reads) ──────────────────────────────
  //

  /** POST /api/doctors  → Create a new doctor under the logged-in clinic */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @ReqUser() user: UserData,
    @Body() createDoctorDto: CreateDoctorDto,
  ) {
    return this.doctorsService.create(user.uid, createDoctorDto);
  }

  /** GET /api/doctors  → List doctors *for this clinic* */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  async findAllForClinic(@ReqUser() user: UserData) {
    return this.doctorsService.findAll(user.uid);
  }

  /** PATCH /api/doctors/:id  → Update a doctor's details */
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @ReqUser() user: UserData,
    @Param('id') doctorId: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    const updated = await this.doctorsService.update(
      user.uid,
      doctorId,
      updateDoctorDto,
    );
    if (!updated) throw new NotFoundException('Doctor not found');
    return updated;
  }

  /** DELETE /api/doctors/:id  → Remove a doctor */
  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(@ReqUser() user: UserData, @Param('id') doctorId: string) {
    await this.doctorsService.remove(user.uid, doctorId);
    return { success: true };
  }

  //
  // ─── SCHEDULE MANAGEMENT ───────────────────────────────────────────────────────
  //

  /** POST   /api/doctors/:id/schedules
   *   Add one availability slot for ":id" */
  @Post(':id/schedules')
  @UseGuards(FirebaseAuthGuard)
  async addSchedule(
    @ReqUser() user: UserData,
    @Param('id') doctorId: string,
    @Body() dto: CreateDoctorScheduleDto,
  ) {
    return this.doctorsService.addSchedule(user.uid, doctorId, dto);
  }

  /** PATCH  /api/doctors/:id/schedules/:scheduleId
   *   Edit an existing slot */
  @Patch(':id/schedules/:scheduleId')
  @UseGuards(FirebaseAuthGuard)
  async updateSchedule(
    @ReqUser() user: UserData,
    @Param('id') doctorId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    return this.doctorsService.updateSchedule(user.uid, scheduleId, dto);
  }

  /** DELETE /api/doctors/:id/schedules/:scheduleId
   *   Remove one availability slot */
  @Delete(':id/schedules/:scheduleId')
  @UseGuards(FirebaseAuthGuard)
  async removeSchedule(
    @ReqUser() user: UserData,
    @Param('id') doctorId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.doctorsService.removeSchedule(user.uid, scheduleId);
    return { success: true };
  }

  //
  // ─── SINGLE DOCTOR PROFILE ────────────────────────────────────────────────────
  //

  /** GET /api/doctors/:id → doctor profile + all its slots */
  @Get(':id')
  async findOneProfile(@Param('id') id: string) {
    const data = await this.doctorsService.findOneProfile(id);
    if (!data) throw new NotFoundException('Doctor not found');
    return { success: true, data };
  }

  //
  // ─── QUEUE INTEGRATION ───────────────────────────────────────────────────────
  //

  /** GET /api/doctors/queue → List doctors with real-time queue info */
  @Get('clinic/queue')
  @UseGuards(FirebaseAuthGuard)
  async getDoctorsWithQueue(@ReqUser() user: UserData) {
    return this.queueService.getDoctorsQueue(user.uid);
  }
}
