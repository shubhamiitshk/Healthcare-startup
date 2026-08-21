import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserRecord } from 'firebase-admin/auth';
import { Clinic } from '../entities/clinic.entity';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { TimeSlotDto } from './dto/time-slot.dto';
import { firebaseAdmin } from '../auth/firebase.config';
import { isFirebaseAuthError } from '../types/firebase-error';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(DoctorSchedule)
    private doctorSchedulesRepository: Repository<DoctorSchedule>,
  ) {}

  async createClinic(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const { email, password, doctors, ...clinicData } = createClinicDto;

    let firebaseUser: UserRecord;
    try {
      firebaseUser = await firebaseAdmin.auth().createUser({
        email,
        password,
      });
    } catch (error: unknown) {
      if (
        isFirebaseAuthError(error) &&
        error.code === 'auth/email-already-exists'
      ) {
        throw new ConflictException(
          'Clinic with this email already exists in Firebase',
        );
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Firebase user creation failed: ${message}`);
    }

    const existingClinic = await this.clinicsRepository.findOne({
      where: { email },
    });
    if (existingClinic) {
      throw new ConflictException(
        'Clinic with this email already exists in Supabase',
      );
    }

    const clinic = this.clinicsRepository.create({
      ...clinicData,
      email,
      id: firebaseUser.uid,
    });

    const savedClinic = await this.clinicsRepository.save(clinic);

    for (const doctorDto of doctors) {
      const doctor = this.doctorsRepository.create({
        name: doctorDto.name,
        gender: doctorDto.gender,
        specialty: doctorDto.specialty,
        email: doctorDto.email,
        qualification: doctorDto.qualification,
        phone: doctorDto.phone,
        date_of_birth: doctorDto.dateOfBirth,
        experience_years: doctorDto.experienceYears,
        avatar_url: doctorDto.avatarUrl,
        clinic: savedClinic,
      });
      const savedDoctor = await this.doctorsRepository.save(doctor);

      const scheduleByDay: Array<[string, TimeSlotDto[] | undefined]> = [
        ['monday', doctorDto.schedule.monday],
        ['tuesday', doctorDto.schedule.tuesday],
        ['wednesday', doctorDto.schedule.wednesday],
        ['thursday', doctorDto.schedule.thursday],
        ['friday', doctorDto.schedule.friday],
        ['saturday', doctorDto.schedule.saturday],
        ['sunday', doctorDto.schedule.sunday],
      ];
      for (const [day, slots] of scheduleByDay) {
        if (Array.isArray(slots)) {
          const typedSlots: TimeSlotDto[] = slots;
          for (const slot of typedSlots) {
            const doctorSchedule = this.doctorSchedulesRepository.create({
              day_of_week: day,
              start_time: slot.startTime,
              end_time: slot.endTime,
              doctor: savedDoctor,
            });
            await this.doctorSchedulesRepository.save(doctorSchedule);
          }
        } else {
          console.warn(
            `Schedule for day '${day}' for doctor '${doctorDto.name}' is not an array. Skipping.`,
          );
        }
      }
    }

    const clinicWithRelations = await this.clinicsRepository.findOne({
      where: { id: savedClinic.id },
      relations: ['doctors', 'doctors.schedules'],
    });

    if (!clinicWithRelations) {
      throw new NotFoundException(
        'Newly created clinic not found after fetching relations.',
      );
    }

    return clinicWithRelations;
  }

  async findClinicByEmail(email: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { email },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async findClinicById(id: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { id },
      relations: ['doctors', 'doctors.schedules'],
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async login(
    email: string,
    idToken: string,
  ): Promise<{ token: string; clinic: Clinic }> {
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      console.log('Backend: Firebase ID Token verified for UID:', firebaseUid);

      if (decodedToken.email !== email) {
        throw new UnauthorizedException('Email mismatch in token and request');
      }

      const clinic = await this.findClinicById(firebaseUid);
      return { token: idToken, clinic };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Backend Login Error (verifyIdToken):', message);
      if (isFirebaseAuthError(error)) {
        if (
          error.code === 'auth/argument-error' ||
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/id-token-expired'
        ) {
          throw new UnauthorizedException(
            'Invalid or expired authentication token',
          );
        }
        if (error.code.startsWith('auth/')) {
          throw new UnauthorizedException(`Firebase Auth error: ${message}`);
        }
      }
      throw new UnauthorizedException('Login failed: Invalid credentials');
    }
  }

  async changePassword(
    firebaseUid: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await firebaseAdmin.auth().getUser(firebaseUid);
      const email = user.email;
      if (!email) {
        throw new UnauthorizedException('User has no email associated');
      }

      const apiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!apiKey) {
        throw new UnauthorizedException(
          'Password change is not configured: missing FIREBASE_WEB_API_KEY',
        );
      }

      const verifyResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: oldPassword,
            returnSecureToken: true,
          }),
        },
      );
      if (!verifyResp.ok) {
        throw new UnauthorizedException('Incorrect old password');
      }

      await firebaseAdmin
        .auth()
        .updateUser(firebaseUid, { password: newPassword });
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      if (isFirebaseAuthError(error)) {
        if (error.code === 'auth/user-not-found') {
          throw new NotFoundException('User not found');
        }
        if (error.code.startsWith('auth/')) {
          throw new UnauthorizedException('Firebase Auth error');
        }
      }
      throw new UnauthorizedException('Failed to change password');
    }
  }
}
