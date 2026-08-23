-- =============================================================================
-- CatchQ Database Initial Schema & Seed Data
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLINICS
CREATE TABLE IF NOT EXISTS clinics (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
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
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week VARCHAR NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  fees NUMERIC DEFAULT 0,
  booking_start TIME DEFAULT '00:00:00',
  booking_end TIME DEFAULT '23:59:00',
  booking_window BOOLEAN DEFAULT true,
  max_queue INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
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
CREATE TABLE IF NOT EXISTS family_members (
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
CREATE TABLE IF NOT EXISTS appointments (
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

CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_one_per_entity
  ON appointments (
    schedule_id,
    date,
    COALESCE(patient_id, family_member_id::varchar)
  );

-- 7. FOLLOW UPS
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" VARCHAR NOT NULL,
  reason VARCHAR NOT NULL,
  "appointmentType" VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  time VARCHAR NOT NULL,
  notes VARCHAR,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 8. WARDS
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  ward_type VARCHAR NOT NULL DEFAULT 'general',
  capacity INT NOT NULL DEFAULT 10,
  floor INT DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BEDS
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  bed_number VARCHAR NOT NULL,
  bed_type VARCHAR NOT NULL DEFAULT 'standard',
  status VARCHAR NOT NULL DEFAULT 'available',
  has_ventilator BOOLEAN DEFAULT false,
  has_cardiac_monitor BOOLEAN DEFAULT false,
  has_oxygen BOOLEAN DEFAULT false,
  is_isolation BOOLEAN DEFAULT false,
  daily_rate NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, bed_number)
);

-- 10. BED ALLOCATIONS
CREATE TABLE IF NOT EXISTS bed_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  admitted_at TIMESTAMPTZ DEFAULT NOW(),
  expected_discharge TIMESTAMPTZ,
  actual_discharge TIMESTAMPTZ,
  discharge_notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BED EQUIPMENT
CREATE TABLE IF NOT EXISTS bed_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  equipment_type VARCHAR NOT NULL,
  serial_number VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'functional',
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  payment_mode VARCHAR DEFAULT 'cash',
  status VARCHAR DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. WHATSAPP MESSAGES
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR NOT NULL DEFAULT 'system',
  patient_id VARCHAR,
  appointment_id VARCHAR,
  wa_message_id VARCHAR UNIQUE,
  wa_contact_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'text',
  direction VARCHAR NOT NULL,
  content TEXT,
  metadata JSONB,
  status VARCHAR NOT NULL DEFAULT 'pending',
  error_message VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule_date ON appointments(schedule_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_members_patient_id ON family_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_wards_clinic_id ON wards(clinic_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward_id ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_bed_allocations_bed_id ON bed_allocations(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_allocations_patient_id ON bed_allocations(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_date ON invoices(clinic_id, date);

-- =============================================================================
-- SEED DATA (For local development & instant testing)
-- =============================================================================
INSERT INTO clinics (id, name, address, phone, email)
VALUES ('demo-clinic-01', 'CatchQ Central Health Clinic', '100 Medical Center Blvd, Suite 200', '+1-555-0199', 'demoadmin@gmail.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, clinic_id, name, gender, specialty, qualification, phone, email, experience_years)
VALUES 
  ('d1111111-1111-1111-1111-111111111111', 'demo-clinic-01', 'Dr. Sarah Jenkins', 'female', 'General Physician', 'MD, MBBS', '+1-555-0101', 'sarah.jenkins@catchq.com', 8),
  ('d2222222-2222-2222-2222-222222222222', 'demo-clinic-01', 'Dr. Michael Chen', 'male', 'Pediatrician', 'MD, FAAP', '+1-555-0102', 'michael.chen@catchq.com', 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, fees, max_queue)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'monday', '09:00:00', '17:00:00', 50.00, 20),
  ('s1111111-1111-1111-1111-111111111112', 'd1111111-1111-1111-1111-111111111111', 'tuesday', '09:00:00', '17:00:00', 50.00, 20),
  ('s1111111-1111-1111-1111-111111111113', 'd1111111-1111-1111-1111-111111111111', 'wednesday', '09:00:00', '17:00:00', 50.00, 20),
  ('s1111111-1111-1111-1111-111111111114', 'd1111111-1111-1111-1111-111111111111', 'thursday', '09:00:00', '17:00:00', 50.00, 20),
  ('s1111111-1111-1111-1111-111111111115', 'd1111111-1111-1111-1111-111111111111', 'friday', '09:00:00', '17:00:00', 50.00, 20),
  ('s1111111-1111-1111-1111-111111111116', 'd1111111-1111-1111-1111-111111111111', 'saturday', '10:00:00', '14:00:00', 60.00, 10),
  ('s1111111-1111-1111-1111-111111111117', 'd1111111-1111-1111-1111-111111111111', 'sunday', '10:00:00', '14:00:00', 60.00, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wards (id, clinic_id, name, ward_type, capacity, floor)
VALUES
  ('w1111111-1111-1111-1111-111111111111', 'demo-clinic-01', 'General Ward A', 'general', 10, 1),
  ('w2222222-2222-2222-2222-222222222222', 'demo-clinic-01', 'ICU', 'icu', 6, 2),
  ('w3333333-3333-3333-3333-333333333333', 'demo-clinic-01', 'Emergency', 'emergency', 8, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO beds (id, ward_id, bed_number, bed_type, status, has_oxygen, daily_rate)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'w1111111-1111-1111-1111-111111111111', 'A-101', 'standard', 'available', true, 100.00),
  ('b1111111-1111-1111-1111-111111111112', 'w1111111-1111-1111-1111-111111111111', 'A-102', 'standard', 'available', true, 100.00),
  ('b2222222-2222-2222-2222-222222222221', 'w2222222-2222-2222-2222-222222222222', 'ICU-201', 'icu', 'available', true, 350.00)
ON CONFLICT (id) DO NOTHING;
