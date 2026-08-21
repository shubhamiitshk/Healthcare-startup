export interface DoctorSchedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  time?: string;
  doctor?: string;
  isBooked?: boolean;
  queueCount?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  schedules: DoctorSchedule[];
}

export interface Schedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  queueCount?: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  doctor: string;
  isBooked: boolean;
  patientName?: string;
}

export interface Patient {
  id: string;
  queueNo: number;
  name: string;
  phone: string;
  sex: string;
  doctor: string;
  doctorId?: string;
  slotId: string | null;
  status: "serving" | "waiting" | "completed" | "skipped" | "cancelled";
  source: "web" | "mobile";
  queue_number?: number;
}

export interface DoctorWithQueue {
  doctorId: string;
  doctorName: string;
  scheduleId: string;
  slot: { from: string; to: string };
  totalQueue: number;
  currentServing: number;
}

export interface AppointmentRow {
  id: string;
  queueNo: number;
  slotId?: string | null;
  doctorId?: string;
  status: string;
  source: string;
  patient?: {
    id: string;
    phone_number: string;
    fullName: string;
    gender: string;
    dob: string;
  };
  familyMember?: {
    id: string;
    patient_id: string;
    name: string;
    gender: string;
    dob: string;
    relation: string;
  };
}

export interface NewPatientForm {
  name: string;
  phone: string;
  sex: string;
  dob: string;
  doctor: string;
  slotId: string | null;
  source: "web" | "mobile";
  familyMemberId?: string;
}

export type PatientStatus = Patient["status"];
