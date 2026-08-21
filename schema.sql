-- ============================================
-- CatchQ Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CLINICS
CREATE TABLE clinics (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCTORS
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  gender VARCHAR NOT NULL,
  specialty VARCHAR NOT NULL,
  qualification VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  date_of_birth DATE,
  experience_years INT,
  avatar_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOCTOR SCHEDULES
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week VARCHAR NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  fees NUMERIC DEFAULT 0,
  booking_start TIME DEFAULT '00:00:00',
  booking_end TIME DEFAULT '23:59:00',
  booking_window BOOLEAN DEFAULT true,
  max_queue INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PATIENTS
CREATE TABLE patients (
  id VARCHAR PRIMARY KEY,
  phone_number VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  gender VARCHAR,
  dob DATE,
  is_profile_complete BOOLEAN DEFAULT false,
  "firebaseUid" VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. FAMILY MEMBERS
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  gender VARCHAR NOT NULL,
  dob DATE NOT NULL,
  relation VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. APPOINTMENTS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  schedule_id UUID NOT NULL REFERENCES doctor_schedules(id) ON DELETE CASCADE,
  queue_number INT DEFAULT 0,
  date DATE NOT NULL,
  status TEXT DEFAULT 'waiting',
  source TEXT DEFAULT 'mobile',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one appointment per patient/family member per schedule per day
CREATE UNIQUE INDEX ux_appointments_one_per_entity
  ON appointments (
    schedule_id,
    date,
    COALESCE(patient_id, family_member_id::varchar)
  );

-- 7. FOLLOW UPS
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" VARCHAR NOT NULL,
  reason VARCHAR NOT NULL,
  "appointmentType" VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  time VARCHAR NOT NULL,
  notes VARCHAR,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for common queries
-- ============================================
CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX idx_appointments_schedule_date ON appointments(schedule_id, date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_family_members_patient_id ON family_members(patient_id);
CREATE INDEX idx_patients_phone ON patients(phone_number);
