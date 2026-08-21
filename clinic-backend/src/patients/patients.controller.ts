import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';

@Controller('patients')
@UseGuards(FirebaseAuthGuard)
export class PatientsController {
  constructor(private readonly svc: PatientsService) {}

  /** Called right after OTP verify */
  @Post()
  async create(@Body() dto: CreatePatientDto) {
    return this.svc.createOrGet(undefined, dto);
  }

  /** Used by ProfileScreen & UserProfile */
  @Get(':id')
  async findOne(@ReqUser() user: UserData, @Param('id') id: string) {
    if (user.uid !== id) throw new ForbiddenException();
    return this.svc.findById(id);
  }

  /** Called when user finishes profile */
  @Patch(':id')
  async update(
    @ReqUser() user: UserData,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    if (user.uid !== id) throw new ForbiddenException();
    return this.svc.updateProfile(id, dto);
  }

  /** Add a family member */
  @Post(':id/family-members')
  @UseGuards(FirebaseAuthGuard)
  async addFamilyMember(
    @ReqUser() user: UserData,
    @Param('id') id: string,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    if (user.uid !== id) throw new ForbiddenException();
    return this.svc.addFamilyMember(id, dto);
  }

  /** Search patient by phone number */
  @Get('search/:phone')
  @UseGuards(FirebaseAuthGuard)
  async findByPhone(@Param('phone') phone: string) {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.length > 10) {
      normalized = normalized.slice(-10);
    }
    normalized = '+91' + normalized;
    return this.svc.findByPhone(normalized);
  }
}
