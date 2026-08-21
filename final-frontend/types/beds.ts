export interface Ward {
  id: string
  clinic_id: string
  name: string
  ward_type: string
  capacity: number
  floor: number
  description?: string
  is_active: boolean
  beds: Bed[]
  created_at: string
  updated_at: string
}

export interface Bed {
  id: string
  ward_id: string
  bed_number: string
  bed_type: string
  status: "available" | "occupied" | "reserved" | "maintenance" | "cleaning"
  has_ventilator: boolean
  has_cardiac_monitor: boolean
  has_oxygen: boolean
  is_isolation: boolean
  daily_rate: number
  notes?: string
  ward?: Ward
  allocations: BedAllocation[]
  equipment: BedEquipment[]
  created_at: string
  updated_at: string
}

export interface BedAllocation {
  id: string
  bed_id: string
  patient_id?: string
  appointment_id?: string
  admitted_at: string
  expected_discharge?: string
  actual_discharge?: string
  discharge_notes?: string
  status: "active" | "discharged" | "transferred"
  bed?: Bed
  patient?: {
    id: string
    full_name: string
    phone_number: string
  }
  created_at: string
  updated_at: string
}

export interface BedEquipment {
  id: string
  bed_id: string
  equipment_type: string
  serial_number?: string
  status: "functional" | "maintenance" | "out_of_order"
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
}

export interface BedStats {
  total: number
  available: number
  occupied: number
  reserved: number
  maintenance: number
  cleaning: number
  urgent: number
  occupancy_rate: number
  wardBreakdown: WardBreakdown[]
}

export interface WardBreakdown {
  ward_id: string
  ward_name: string
  ward_type: string
  capacity: number
  total_beds: number
  available: number
  occupied: number
  reserved: number
  maintenance: number
}

export interface CreateWardDto {
  name: string
  ward_type?: string
  capacity: number
  floor?: number
  description?: string
  is_active?: boolean
}

export interface CreateBedDto {
  ward_id: string
  bed_number: string
  bed_type?: string
  has_ventilator?: boolean
  has_cardiac_monitor?: boolean
  has_oxygen?: boolean
  is_isolation?: boolean
  daily_rate?: number
  notes?: string
}

export interface AllocateBedDto {
  bed_id: string
  patient_id?: string
  appointment_id?: string
  expected_discharge?: string
}

export interface DischargeBedDto {
  discharge_notes?: string
}
