import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ReqUser } from '../auth/req-user.decorator';
import type { UserData } from '../types/express';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post('register')
  async register(@Body() createClinicDto: CreateClinicDto) {
    const clinic = await this.clinicsService.createClinic(createClinicDto);
    return {
      success: true,
      data: clinic,
    };
  }

  @Post('login')
  async login(
    @Headers('authorization') authorization: string,
    @Body('email') email: string,
  ) {
    const idToken = authorization ? authorization.split(' ')[1] : null;
    if (!idToken) {
      throw new UnauthorizedException('Authorization token not provided');
    }
    const { token, clinic } = await this.clinicsService.login(email, idToken);
    return {
      success: true,
      data: {
        token,
        clinic,
      },
    };
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@ReqUser() user: UserData) {
    const clinic = await this.clinicsService.findClinicById(user.uid);
    return {
      success: true,
      data: clinic,
    };
  }

  @Patch('change-password')
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @ReqUser() user: UserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.clinicsService.changePassword(
      user.uid,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
