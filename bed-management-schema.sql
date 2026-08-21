-- ============================================
-- CatchQ Hospital Bed Management Schema
-- ============================================

-- 1. WARDS
CREATE TABLE wards (
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

-- 2. BEDS
CREATE TABLE beds (
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

-- 3. BED ALLOCATIONS (patient <-> bed)
CREATE TABLE bed_allocations (
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

-- 4. BED EQUIPMENT (per-bed equipment tracking)
CREATE TABLE bed_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  equipment_type VARCHAR NOT NULL,
  serial_number VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'functional',
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_wards_clinic_id ON wards(clinic_id);
CREATE INDEX idx_beds_ward_id ON beds(ward_id);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_bed_allocations_bed_id ON bed_allocations(bed_id);
CREATE INDEX idx_bed_allocations_patient_id ON bed_allocations(patient_id);
CREATE INDEX idx_bed_allocations_status ON bed_allocations(status);
CREATE INDEX idx_bed_equipment_bed_id ON bed_equipment(bed_id);

-- ============================================
-- Sample Data
-- ============================================
INSERT INTO wards (clinic_id, name, ward_type, capacity, floor) VALUES
  ('your-clinic-id', 'ICU', 'icu', 8, 1),
  ('your-clinic-id', 'General Ward A', 'general', 10, 1),
  ('your-clinic-id', 'Emergency', 'emergency', 6, 0),
  ('your-clinic-id', 'Maternity', 'maternity', 6, 2),
  ('your-clinic-id', 'Pediatric', 'pediatric', 6, 2);
