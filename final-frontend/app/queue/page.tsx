"use client";

import React,{ useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
  ChevronDown,
  ChevronUp,
  Menu,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Clock,
}from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FollowUpForm } from "@/components/follow-up-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout"
import { useAuth } from "@/components/auth-provider";
import { auth } from "@/firebase";
import {
  DAYS_OF_WEEK,
  getNextDateOfWeek,
  getNext7Days,
  convertTo24Hour,
  toMinutes,
  parseLocalDate,
  nowTimeString,
} from "@/lib/queue/utils";
import type {
  DoctorSchedule,
  Doctor,
  TimeSlot,
  Patient,
  DoctorWithQueue,
  AppointmentRow,
  NewPatientForm,
} from "@/lib/queue/types";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function PatientQueue() {
  // Follow Up dialog state (must be inside the component)
  const [followUpDialogOpen, setFollowUpDialogOpen] = React.useState(false);
  // Use a type-safe object for follow up dialog patient
  const [followUpDialogPatient, setFollowUpDialogPatient] = React.useState<{ patientName: string; patientId: string } | null>(null);
  const DAYS_OF_WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] as const;
  // Initialize date/time-dependent state to empty/null
  const [todayName, setTodayName] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedDayObj, setSelectedDayObj] = useState<any>(null);

  // Set them in a useEffect (client only)
  useEffect(() => {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setTodayName(day);
    setSelectedDay(day);
    const days = getNext7Days();
    setSelectedDayObj(days[0]);
  }, []);

  const now = new Date();
  const nowTime = now.getHours().toString().padStart(2,'0')+ ':' + now.getMinutes().toString().padStart(2,'0');
  const [bookedScheduleIds, setBookedScheduleIds] = useState<string[]>([]);
  const { clinic, isLoading, user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]); // Store real doctors from backend
  const [socket, setSocket] = useState<any>(null); // WebSocket connection

  const [patients, setPatients] = useState<AppointmentRow[]>([]);
  const patientPhoneMap: Record<string, string> = {};
  patients.forEach((p) => {
    if (p.patient) {
      patientPhoneMap[p.patient.id] = p.patient.phone_number;
    }
  });
  // ─── form‐side schedules + selected day ───
  const [formSchedules, setFormSchedules] = useState<DoctorSchedule[]>([]);
  

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    name: "",
    phone: "",
    sex: "",
    dob: "",
    doctor: "",
    slotId: null,
    source: "web",
    familyMemberId: "",
  }); 
  
  const [patientExists, setPatientExists] = useState<boolean | null>(null);
  const [fetchedPatient, setFetchedPatient] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(false);

  // New state for family member functionality
  const [selectedMember, setSelectedMember] = useState<string>("self");
  const [isNewMember, setIsNewMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    gender: "",
    dob: "",
    relation: "",
  });
  const [addingFamilyMember, setAddingFamilyMember] = useState(false);

  // Add new state for appointments for the selected day
  const [appointmentsForDay, setAppointmentsForDay] = useState<any[]>([]);

  // Function to check if a specific family member already has an appointment
  const checkFamilyMemberAppointment = async (familyMemberId: string, scheduleId: string, date: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // Use the appointments endpoint which returns all appointments for patient + family members
      const response = await fetch(
        `${API_URL}/appointments/patient/${fetchedPatient.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const appointments = await response.json();
        // Filter to find appointments for this specific family member and slot for the given date
        // Use snake_case field names as returned by the database
        return appointments.some((appt: any) => 
          appt.family_member_id === familyMemberId && 
          appt.schedule_id === scheduleId &&
          appt.date === date
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking family member appointment:", error);
      return false;
    }
  };

  // Update formSchedules when doctor or selectedDay changes
  useEffect(() => {
    const doc = doctors.find(d => d.id === newPatient.doctor);
    if (!doc) {
      setFormSchedules([]);
      return;
    }
    // Filter schedules for the selected day
    const filtered = doc.schedules.filter(s => s.day_of_week.trim().toLowerCase() === selectedDay.toLowerCase());
    setFormSchedules(filtered);
  }, [newPatient.doctor, doctors, selectedDay]);
      async function verifyPhone() {
        // strip non-digits
        let raw = newPatient.phone.replace(/\D/g, '');
        if (raw.length > 10) {
          toast({ title: 'Invalid number', description: 'Mobile number cannot be more than 10 digits.', variant: 'destructive' });
          return;
        }
        // Frontend validation: must be exactly 10 digits
        if (!/^\d{10}$/.test(raw)) {
          toast({ title: 'Invalid number', description: 'Enter a 10-digit mobile.', variant: 'destructive' });
          return;
        }
        const phone = '+91' + raw;              // ← always +91
        setVerifying(true);
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_URL}/patients/search/${encodeURIComponent(phone)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        if (res.ok) {
          const json = await res.json();
          const p = json.data ?? json;
          {
            const date = getNextDateOfWeek(selectedDay, todayName);
            const resp2 = await fetch(
              `${API_URL}/appointments/patient/${p.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resp2.ok) {
              const apptsRespVerify = await resp2.json();
              const apptsArrVerify = apptsRespVerify.data ?? apptsRespVerify;
              const dateAppointmentsVerify = Array.isArray(apptsArrVerify) ? apptsArrVerify.filter((a: any) => a.date === date) : [];
              setAppointmentsForDay(dateAppointmentsVerify); // store all appointments for the day
              setBookedScheduleIds(dateAppointmentsVerify.map((a: any) => a.schedule_id)); // keep for legacy use
            }
          }
          setFetchedPatient(p);
          setFamilyMembers(p.familyMembers || []);
          setNewPatient(np => ({
            ...np,
            name:  p.fullName  ?? '',
            sex:   p.gender 
            ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase()       
            : '',
            dob:   p.dob       ?? '',
          }));
          setPatientExists(true);
          setSelectedMember("self"); // Reset to self when patient is found
          setIsNewMember(false); // Reset new member form
          toast({ title: 'Existing patient', description: 'Details loaded.' });
        } else if (res.status === 404) {
          setFetchedPatient(null);
          setFamilyMembers([]);
          setPatientExists(false);
          setSelectedMember("self"); // Reset to self for new patient
          setIsNewMember(false); // Reset new member form
          toast({ title: 'New patient', description: 'Please fill in details.' });
         // ─── clear fields for new ─────────────────
          setNewPatient(np => ({
            ...np,
            name: '',
            sex:  '',
            dob:  '',
          }));
        } else {
          throw new Error(`Unexpected status ${res.status}`);
        }
      } catch (err: any) {
        console.error(err);
        toast({ title: 'Lookup failed', description: err.message, variant: 'destructive' });
      } finally {
        setVerifying(false);
      }
    }
  // ──────────────────────────────────────────────────────────────────────────
  // 2) DOCTOR + SLOT SELECTION (MAIN QUEUE)
  // ──────────────────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────────────────
  // 3) TIME SLOTS STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingStartTime, setEditingStartTime] = useState("");
  const [editingEndTime, setEditingEndTime] = useState("");
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [selectedScheduleDoctor, setSelectedScheduleDoctor] = useState("");
  const [selectedScheduleDoctorSchedules, setSelectedScheduleDoctorSchedules] = useState<DoctorSchedule[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);


  const [bookingSettings, setBookingSettings] = useState({
    onlineBookingEnabled: true,
    bookingStart: "08:00",
    bookingEnd: "17:00",
  });

  // Function to filter patients by status
  const filteredPatients = (status: string) => {
    return patients
      .filter(p => p.status === status)
      .filter(p => p.slotId === selectedSlot);
  };
  

  // Split patients by status for easier rendering
  const servingPatientsList = filteredPatients("serving");
  const waitingPatientsList = filteredPatients("waiting");
  const completedPatientsList = filteredPatients("completed");
  const skippedPatientsList = filteredPatients("skipped");
  const cancelledPatientsList = filteredPatients("cancelled");

  // ──────────────────────────────────────────────────────────────────────────
  // 4) FILTER + EXPANDER STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedSections, setExpandedSections] = useState({
    serving: true,
    waiting: true,
    completed: true,
    skipped: false,
    cancelled: false
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5) EMERGENCY + TOAST STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // 6) TIME OPTIONS
  // ──────────────────────────────────────────────────────────────────────────
  const timeOptions = [
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
    "08:30 PM",
    "09:00 PM",
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 7) EFFECT: WHEN selectedDoctor CHANGES, PICK FIRST SLOT OR NULL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // find the selected doctor's schedules, filter for today, then pick first slot
    const doc = doctors.find(d => d.id === selectedDoctor);
    const todaySchedules = doc?.schedules.filter(
      s => s.day_of_week.trim().toLowerCase() === todayName.toLowerCase()
    ) ?? [];
    setSelectedSlot(todaySchedules[0]?.id ?? null);
  }, [selectedDoctor, doctors, todayName]);

  // Make sure this is after all state declarations:
  // const [selectedDayObj, setSelectedDayObj] = useState(...);
  // const [selectedDoctor, setSelectedDoctor] = useState(...);
  // const [selectedSlot, setSelectedSlot] = useState(...);
  // ...

  // Combine doctor and slot auto-selection into a single effect
  useEffect(() => {
    if (doctors.length) {
      let doctorId = selectedDoctor;
      if (!doctorId || !doctors.some(d => d.id === doctorId)) {
        doctorId = doctors[0].id;
        setSelectedDoctor(doctorId);
      }
      const doc = doctors.find(d => d.id === doctorId);
      if (doc && selectedDayObj) {
        const slots = doc.schedules.filter(
          s => s.day_of_week.trim().toLowerCase() === selectedDayObj.day.toLowerCase()
        );
        if (slots.length && (!selectedSlot || !slots.some(s => s.id === selectedSlot))) {
          setSelectedSlot(slots[0].id);
        }
      }
    }
  }, [doctors, selectedDoctor, selectedDayObj, selectedSlot]);

  // Add a queueReady flag
  const queueReady = Boolean(selectedDoctor && selectedSlot && selectedDayObj && doctors.length);

  // Define fetchQueue at the top-level of PatientQueue
  const fetchQueue = useCallback(async () => {
    if (!queueReady) {
      setPatients([]);
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const resp = await fetch(
        `${API_URL}/appointments?scheduleId=${selectedSlot}&date=${selectedDayObj.date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let patients = await resp.json();
      patients = patients.map((p: any) => ({
        ...p,
        doctorId: p.doctorId || p.doctor_id,
        slotId: p.slotId || p.schedule_id,
        queueNo: p.queueNo || p.queue_number,
        patient: p.patient,
        familyMember: p.familyMember,
      }));
      setPatients(patients.sort((a: AppointmentRow, b: AppointmentRow) => a.queueNo - b.queueNo));
    } catch (err) {
      setPatients([]);
    }
  }, [queueReady, selectedSlot, selectedDayObj?.date]);

  // In the useEffect for queue fetching, call fetchQueue
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // ──────────────────────────────────────────────────────────────────────────
  // 8) EFFECT: WHEN newPatient.doctor CHANGES, PRESELECT FORM'S SLOT OR NULL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const slotsForNew = timeSlots.filter(
      (slot) => slot.doctor === newPatient.doctor
    );
    if (slotsForNew.length > 0) {
      setNewPatient((prev) => ({ ...prev, slotId: slotsForNew[0].id }));
    } else {
      setNewPatient((prev) => ({ ...prev, slotId: null }));
    }
  }, [newPatient.doctor, timeSlots]);

  // ──────────────────────────────────────────────────────────────────────────
  // 9) HELPER: GET TODAY'S SLOTS FOR A GIVEN DOCTOR  // ──────────────────────────────────────────────────────────────────────────
  const getTodaySlots = (): DoctorSchedule[] => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    
    return selectedScheduleDoctorSchedules.filter((s) => {
      // coerce undefined → "", then trim/lowercase
      const day = (s.day_of_week ?? "").trim().toLowerCase();
      return day === today.toLowerCase();
    
    });
  };

  const generateTimeSlots = (startTime: string, endTime: string, interval: number): string[] => {
    // Convert backend format (HH:mm:ss) to HH:mm
    const convertTime = (time: string) => {
      const [hours, minutes] = time.split(':');
       return `${hours}:${minutes}`;
    };
    
    const start = convertTime(startTime);
    const end = convertTime(endTime);

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const slots: string[] = [];
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      );
      
      currentMinute += interval;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  };

  /**
   * Given one Doctor (with .schedules[]),
   * filters only today's slots and breaks each into 30-min TimeSlots.
   */
  function initializeSlotsForDoctor(doc: Doctor) {
    // get today's weekday name
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  
    // filter doctor's schedules for today
    const todaySchedules = doc.schedules.filter(
      s => s.day_of_week.toLowerCase() === today.toLowerCase()
    );
  
    const slots: TimeSlot[] = [];
  
    todaySchedules.forEach(sch => {
      // push one slot per schedule instead of splitting
      slots.push({
        // unique id combining schedule id + times
        id: `${sch.id}-${sch.start_time.replace(/:/g, "")}-${sch.end_time.replace(/:/g, "")}`,
        // a single "time" string for the whole block
        time: `${sch.start_time} - ${sch.end_time}`,
        doctor: doc.id,
        isBooked: false,
      });
    });
  
    setTimeSlots(slots);
  }
  

  // ──────────────────────────────────────────────────────────────────────────
  // 10) ADD A PATIENT TO QUEUE (PREVENT IF DOCTOR HAS NO SLOTS)
  // ──────────────────────────────────────────────────────────────────────────  
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

  if (!selectedDoctor || !newPatient.slotId) {
    toast({ title: "Error",
      description: "Please select a doctor and time slot.",
      variant: "destructive",
    });
    return;
    }

  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    };
    const raw = newPatient.phone.replace(/\D/g, '');
    const phone_number = '+91' + raw;
    // 1) Create patient if they don't exist yet
    let patientId: string;
    if (!patientExists && (!newPatient.name || !newPatient.sex || !newPatient.dob)) {
      toast({
        title: "Incomplete Profile",
        description: "Please fill in Name, Sex and DOB before adding a new patient.",
        variant: "destructive",
      });
      return;
    }
    if (!patientExists) {
      const createRes = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone_number,
          fullName: newPatient.name,
          gender: newPatient.sex.toLowerCase(),
          dob: newPatient.dob,
        }),
      });
      const createBody = await createRes.json();
      if (!createRes.ok) {
        console.error("❌ Failed to create patient →", createRes.status, createBody);
        throw new Error(createBody.message || "Failed to create patient");
      }
      // Get patientId from all possible locations
      patientId =
        createBody.data?.patientId ??
        createBody.patientId ??
        createBody.data?.id ??
        createBody.id;
      if (!patientId) {
        throw new Error("Failed to get patientId after creating patient");
      }

      const patchRes = await fetch(`${API_URL}/patients/${patientId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fullName: newPatient.name,
          gender: newPatient.sex.toLowerCase(),
          dob: newPatient.dob,
        }),
      });
      const patchBody = await patchRes.json();
      console.log("PATCH response:", patchRes.status, patchBody);
      if (!patchRes.ok) {
        throw new Error(patchBody.message || "Failed to update patient profile");
      }
    } else {
      patientId = fetchedPatient.id;
    }

    // 2) Now add to queue
    const payload: any = {
      patientId, // must be a valid string!
      scheduleId: newPatient.slotId,
      source: newPatient.source,
      date: getNextDateOfWeek(selectedDay, todayName),
    };
    // Only add familyMemberId if it is a real UUID (not 'self' or empty)
    if (
      patientExists &&
      newPatient.familyMemberId &&
      newPatient.familyMemberId !== "self"
    ) {
      payload.familyMemberId = newPatient.familyMemberId;
    }

    // Check if the selected member (self or family member) already has an appointment
    let alreadyBooked = false;
    if (patientExists && newPatient.familyMemberId && newPatient.familyMemberId !== "self") {
      // Check if this specific family member already has an appointment
      alreadyBooked = await checkFamilyMemberAppointment(
        newPatient.familyMemberId,
        newPatient.slotId!,
        getNextDateOfWeek(selectedDay, todayName)
      );
    } else if (patientExists) {
      // Check if the main patient already has an appointment
      alreadyBooked = bookedScheduleIds.includes(newPatient.slotId!);
    }

    if (alreadyBooked) {
      const memberName = patientExists && newPatient.familyMemberId && newPatient.familyMemberId !== "self"
        ? familyMembers.find(fm => fm.id === newPatient.familyMemberId)?.name || "Family member"
        : "You";
      toast({
        title: "Already Booked",
        description: `${memberName} already have an appointment for this slot.`,
        variant: "destructive",
      });
      return;
    }
           

    console.log("Queueing:", payload);
    const queueRes = await fetch(`${API_URL}/appointments/book`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        patientId,
        scheduleId: newPatient.slotId,
        date: getNextDateOfWeek(selectedDay, todayName),
        source: newPatient.source,
        ...(patientExists && newPatient.familyMemberId
          ? { familyMemberId: newPatient.familyMemberId }
          : {}),
      }),
    });
    const queueBody = await queueRes.json();
    if (!queueRes.ok) {
      console.error("❌ Failed to enqueue →", queueRes.status, queueBody);
      throw new Error(queueBody.message || "Failed to add patient");
    }

    // ── add new appointment to local state ─────────────────────────────
    
    

    // 3) Update local state & UI
    const addedPatient = queueBody;
    setPatients(prev => [...prev, addedPatient]);
    // … keep your existing queueNo-assignment + setPatients(…) logic here …

    // After successful add, re-fetch the queue
    await fetchQueue();
    setNewPatient({
      name: "", phone: "", sex: "", dob: "",
      doctor: "", slotId: null, source: "web",
      familyMemberId: "",
    });
    // Reset family member states
    setSelectedMember("self");
    setIsNewMember(false);
    setNewMemberForm({
      name: "",
      gender: "",
      dob: "",
      relation: "",
    });
    toast({
      title: "Patient added",
      description: "Patient has been added to the queue.",
    });
  } catch (err: any) {
    console.error(err);
    toast({
      title: "Failed to add patient",
      description: err.message,
      variant: "destructive",
    });
  }
};

  // ──────────────────────────────────────────────────────────────────────────
  // 11) CHANGE A PATIENT'S STATUS
  // ──────────────────────────────────────────────────────────────────────────
  const handleStatusChange = async (
    id: string,
    status: "serving" | "waiting" | "completed" | "skipped" | "cancelled"
  ) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setPatients(prev => {
        // If reopening a skipped patient to waiting, insert at position 3
        if (status === "waiting") {
          // Find the patient being reopened
          const reopened = prev.find(p => p.id === id);
          if (!reopened) return prev;
          // Create updated patient object (immutable update)
          const updatedPatient = { ...reopened, status: "waiting" as const };
          // Remove from previous position
          let waiting = prev.filter(p => p.status === "waiting" && p.id !== id);
          // Insert at index 2 (third position)
          waiting.splice(2, 0, updatedPatient);
          // DO NOT modify queueNo!
          // All other patients
          const others = prev.filter(p => p.status !== "waiting");
          return [...waiting, ...others];
        } else {
          // Default: just update status
          return prev.map(p => (p.id === id ? { ...p, status } : p));
        }
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to update status",
        description: "There was an error updating the patient status.",
        variant: "destructive",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 12) TOGGLE COLLAPSIBLE SECTIONS
  // ──────────────────────────────────────────────────────────────────────────
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 13) PARSE A TIME RANGE STRING
  // ──────────────────────────────────────────────────────────────────────────
  const parseTimeSlot = (timeSlot: string | undefined) => {
    if (!timeSlot) return { start: "", end: "" };
    const [start, end] = timeSlot.split(' - ');
    return { start, end };
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 14) SLOT EDIT / SAVE / DELETE / ADD (UNCHANGED)
  // ──────────────────────────────────────────────────────────────────────────
  const handleEditSlot = (slotId: string, currentTime: string | undefined) => {
    const { start, end } = parseTimeSlot(currentTime || '');
    setEditingSlot(slotId);
    setEditingStartTime(start);
    setEditingEndTime(end);
  };

  const handleSaveSlot = async (slotId: string) => {
    if (!editingStartTime || !editingEndTime) {
      toast({
        title: "Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const token = await auth.currentUser?.getIdToken();
      // PATCH to your schedules endpoint
      await fetch(
       `${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}/schedules/${slotId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_time:   convertTo24Hour(editingStartTime),
            end_time:     convertTo24Hour(editingEndTime),
            day_of_week:  todayName,
          }),
        }
      );
  
      // ─── NEW ────────────────────────────────────────────────────────────────
      // Re-fetch this doctor's full schedule so we show the DB's truth
      // ─── RELOAD DOCTOR ONCE ────────────────────────────────────────────
      const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store",
          Pragma: "no-cache",
        },
        cache: "no-store",
      }
    );
    if (!resp.ok) throw new Error(`Failed to refresh doctor: ${resp.status}`);
    const body = await resp.json();
  
    // unified unwrap
    const unwrapped =
      body.data?.data  /* { data: { data: doctor } } */ ??
     body.data       /* { data: doctor } */ ??
      body;           /* raw doctor */
  
    setSelectedScheduleDoctorSchedules(unwrapped.schedules || []);
    setDoctors(prev =>
      prev.map(d =>
        d.id === unwrapped.id
          ? { ...d, schedules: unwrapped.schedules || [] }
          : d
      )
    );
      toast({
        title: "Time Slot Updated",
        description: "Your changes have been saved.",
      });
      
      
    }
    
    catch (error) {
      console.error("Error saving slot:", error);
      toast({
        title: "Error",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditingSlot(null);
      setEditingStartTime("");
      setEditingEndTime("");
    }
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
    setEditingStartTime("");
    setEditingEndTime("");
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // DELETE on the schedule
      await fetch(
       `${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}/schedules/${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // remove from local state
      setSelectedScheduleDoctorSchedules((prev) =>
        prev.filter((s) => s.id !== slotId)
      );
  
      toast({
        title: "Time Slot Deleted",
        description: "The slot has been removed.",
      });

      const resp = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache, no-store",
                Pragma: "no-cache",
              },
              cache: "no-store",
            }
          );
          if (!resp.ok) throw new Error(`Failed to refresh doctor: ${resp.status}`);
          const body = await resp.json();
        
          const unwrapped =
            body.data?.data ??
            body.data ??
            body;
        
          setSelectedScheduleDoctorSchedules(unwrapped.schedules || []);
          setDoctors(prev =>
            prev.map(d =>
              d.id === unwrapped.id
                ? { ...d, schedules: unwrapped.schedules || [] }
                : d
            )
          );
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast({
        title: "Error",
        description: "Could not delete slot. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddSlot = async () => {
    if (newSlotStartTime && newSlotEndTime) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}/schedules`, {

          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctor_id:   selectedScheduleDoctor,
            day_of_week: todayName,
            start_time:  convertTo24Hour(newSlotStartTime),
            end_time:    convertTo24Hour(newSlotEndTime)
          })
        });

        if (!res.ok) throw new Error("Failed to add slot");
        
        const newSlot = await res.json();
        
        // Add to local state
        setSelectedScheduleDoctorSchedules(prev => [
          ...prev,
          
            newSlot,
            // newSlot already comes back as { id, day_of_week, start_time, end_time 
          
        ]);
        
        setNewSlotStartTime("");
        setNewSlotEndTime("");
        setShowAddSlot(false);
        toast({
          title: "Time Slot Added",
          description: "New time slot has been added successfully.",
        });

        // ─── RELOAD DOCTOR ONCE ────────────────────────────────────────────
          const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/doctors/${selectedScheduleDoctor}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store",
              Pragma: "no-cache",
            },
            cache: "no-store",
          }
        );
        if (!resp.ok) throw new Error(`Failed to refresh doctor: ${resp.status}`);
        const body = await resp.json();
      
        const unwrapped =
          body.data?.data ??
          body.data ??
          body;
      
        setSelectedScheduleDoctorSchedules(unwrapped.schedules || []);
        setDoctors(prev =>
          prev.map(d =>
            d.id === unwrapped.id
              ? { ...d, schedules: unwrapped.schedules || [] }
              : d
          )
        );
      } catch (error) {
        console.error("Error adding slot:", error);
        toast({
          title: "Error",
          description: "Failed to add time slot. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 15) FILTER PATIENTS BY STATUS, DOCTOR & SELECTED SLOT ONLY
  //     If selectedSlot is null, return an empty array (no patients shown).
  // ──────────────────────────────────────────────────────────────────────────
  

  // ──────────────────────────────────────────────────────────────────────────
  // 7-A) BACKEND FETCH LOGIC - Fetch doctors with queue data
  // ──────────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    console.log('fetchData called');
    if (!user) {
      console.log('No user');
      return;
    }
    const token = await user.getIdToken();
    console.log('Fetching doctors with token:', token);
    const resp = await fetch(`${API_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Doctors API response:', resp);
    const data = await resp.json();
    console.log('Doctors data:', data);
    // Unwrap possible nesting
    const doctorsList = data.data?.data ?? data.data ?? data;
    setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
  }, [user]);

  // Debug: Log when fetchData is called and dependencies
  useEffect(() => {
    console.log('useEffect [isLoading, clinic, auth.currentUser]:', { isLoading, clinic, currentUser: user });
    if (!isLoading && clinic && user) {
      fetchData();
    }
  }, [isLoading, clinic, user, fetchData]);

  useEffect(() => {
    const doctor = doctors.find(d => d.id === selectedScheduleDoctor);
    if (doctor) {
      setSelectedScheduleDoctorSchedules(doctor.schedules || []);
    } else {
      setSelectedScheduleDoctorSchedules([]);
    }
  }, [selectedScheduleDoctor, doctors]);

  // Update doctor dropdown
  const renderDoctorDropdown = () => {
    const realDoctors = doctors.filter(doctor => !doctor.id.startsWith('dummy'));
    return (
      <Select
        value={selectedDoctor}
        onValueChange={(value) => {
          setSelectedDoctor(value);
          const doctor = realDoctors.find(d => d.id === value);
          if (doctor) {
            initializeSlotsForDoctor(doctor); // Use our helper function
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a doctor" />
        </SelectTrigger>
        <SelectContent>
          {realDoctors.map(doctor => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {doctor.name} ({doctor.specialty})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderSchedulePanel = () => {
    const todayLower = todayName.toLowerCase();
    const todaySchedules = selectedScheduleDoctorSchedules.filter(
      s => s.day_of_week.toLowerCase() === todayLower
    );
    const otherSchedules = selectedScheduleDoctorSchedules.filter(
      s => s.day_of_week.toLowerCase() !== todayLower
    );

    // Group otherSchedules by day
    const groupedOtherSchedules: Record<string, DoctorSchedule[]> = {};
    otherSchedules.forEach(schedule => {
      const day = schedule.day_of_week;
      if (!groupedOtherSchedules[day]) {
        groupedOtherSchedules[day] = [];
      }
      groupedOtherSchedules[day].push(schedule);
    });

    return (
      <div className="p-4">
        {/* Today's Availability */}
        {todaySchedules.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Today&apos;s Availability</h3>
            <div className="space-y-2">
              {todaySchedules.map(schedule => (
                <div key={schedule.id} className="flex justify-between items-center">
                  <span>{schedule.start_time.slice(0,5)} - {schedule.end_time.slice(0,5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Day's Availability */}
        {Object.entries(groupedOtherSchedules).map(([day, schedules]) => (
          <div key={day} className="mb-4">
            <h3 className="font-semibold text-lg mb-2">{day}</h3>
            <div className="space-y-2">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex justify-between items-center">
                  <span>{schedule.start_time.slice(0,5)} - {schedule.end_time.slice(0,5)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // REAL-TIME UPDATES WITH WEBSOCKET
  // ──────────────────────────────────────────────────────────────────────────
  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!user || !selectedSlot || !selectedDayObj?.date) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? "http://localhost:3001";
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      withCredentials: true,
    });

    // Build the event name for the current slot and date
    const queueUpdatedEvent = `queue-updated-${selectedSlot}-${selectedDayObj.date}`;

    // Handler to refresh queue when event is received
    const handleQueueUpdate = () => {
      fetchQueue();
    };

    // Listen for the correct real-time event
    newSocket.on(queueUpdatedEvent, handleQueueUpdate);

    // (Keep status-update logic as is)
    newSocket.on('status-update', (updatedAppt: any) => {
      if (
        updatedAppt.doctorId === selectedDoctor &&
        updatedAppt.slotId === selectedSlot &&
        updatedAppt.date === selectedDayObj?.date
      ) {
        setPatients(prev => {
          const filtered = prev.filter(p => p.id !== updatedAppt.id);
          return [...filtered, updatedAppt];
        });
      }
    });

    setSocket(newSocket);

    return () => {
      // Unsubscribe from the event and disconnect socket
      newSocket.off(queueUpdatedEvent, handleQueueUpdate);
      newSocket.disconnect();
    };
  // Only re-run when user, selectedSlot, or selectedDayObj.date changes
  }, [user, selectedSlot, selectedDayObj?.date, selectedDoctor, fetchQueue]);

   // ─── PHASE 4: helper to re-index queue numbers ─────────────────────────
  function reindexQueue(list: AppointmentRow[]) {
    return list
      .sort((a, b) => a.queueNo - b.queueNo)
      .map((p, i) => ({ ...p, queueNo: i + 1 }));
  }

  // ─── PHASE 4: Call Next ───────────────────────────────────────────────
  async function callNext() {
    // 1) grab your current doctor & slot from the queueSelection state:
    const doctorId  = queueSelection?.doctor;
    const scheduleId = queueSelection?.slot;

        // 2) if someone is already in "serving" for this doctor+slot, mark them completed
    const currentlyServing = patients.find(p =>
      p.status   === "serving" &&
          p.doctorId === doctorId   &&
          p.slotId   === scheduleId
        );
        if (currentlyServing) {
          try {
            await handleStatusChange(currentlyServing.id, "completed");
          } catch (err) {
            console.error("Error completing current serving:", err);
          }
        }
    
  
    // 2) pull out the next waiting patient in *that* queue:
    const waitingList = patients
      .filter(p =>
        p.status   === "waiting"  &&
        p.doctorId === doctorId    &&
        p.slotId   === scheduleId
      )
      .sort((a, b) => a.queueNo - b.queueNo);
    const waitingPatients = filteredPatients("waiting");
    if (waitingPatients.length === 0) {
      toast({ title: "No Waiting Patients", variant: "destructive" });
      return;
    }
    const patientToServe = waitingPatients[0];

  
    // 3) flip them to "serving"…
    try {
        await handleStatusChange(patientToServe.id, "serving");
        // 4) re-fetch so the UI updates both lists
        await fetchQueue();
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error calling next patient",
          description: err.message,
          variant: "destructive",
        });
      }
    }
  
  // ─── PHASE 4: Skip Patient ────────────────────────────────────────────
  function skipPatient() {
    const servingPatient = patients.find((p) => p.status === "serving");
    if (servingPatient) {
      handleStatusChange(servingPatient.id, "skipped");
    }
    }

  // 1. Helper to get next 7 days
  const slotsForSelectedDay: DoctorSchedule[] = (() => {
    const doc = doctors.find(d => d.id === selectedDoctor);
    if (!doc || !selectedDayObj) return [];
    return doc.schedules.filter(
      (s: DoctorSchedule) => s.day_of_week.trim().toLowerCase() === selectedDayObj.day.toLowerCase()
    );
  })();

  // Ensure first doctor is selected by default and reset slot when doctors change
  useEffect(() => {
    if (doctors.length) {
      if (!selectedDoctor || !doctors.some(d => d.id === selectedDoctor)) {
        setSelectedDoctor(doctors[0].id);
        setSelectedSlot(null); // reset slot when doctor changes
      }
    }
  }, [doctors, selectedDoctor]);

  // Ensure first slot is selected by default when doctor or day changes
  useEffect(() => {
    if (selectedDoctor && doctors.length && selectedDayObj) {
      const doc = doctors.find(d => d.id === selectedDoctor);
      if (doc) {
        // Find slots for the selected day
        const slots = doc.schedules.filter(
          s => s.day_of_week.trim().toLowerCase() === selectedDayObj.day.toLowerCase()
        );
        if (slots.length && (!selectedSlot || !slots.some(s => s.id === selectedSlot))) {
          setSelectedSlot(slots[0].id);
        }
      }
    }
  }, [selectedDoctor, doctors, selectedDayObj, selectedSlot]);

  // Ensure selectedDayObj is always set (default to today if not set)
  useEffect(() => {
    if (!selectedDayObj) {
      setSelectedDayObj(getNext7Days()[0]);
    }
  }, [selectedDayObj]);

  // Helper function to get doctor name by id
  function getDoctorNameById(doctorId?: string) {
    const doc = doctors.find((d) => d.id === doctorId);
    return doc ? doc.name : "";
  }

  // Remove previous auto-selection effects for doctor/slot
  // Add a single queueSelection state
  const [queueSelection, setQueueSelection] = useState<{ doctor: string; slot: string } | null>(null);

  // When doctors and selectedDayObj are ready, set queueSelection
  useEffect(() => {
    if (doctors.length && selectedDayObj) {
      const doctor = doctors[0];
      const slots = doctor.schedules.filter(
        s => s.day_of_week.trim().toLowerCase() === selectedDayObj.day.toLowerCase()
      );
      if (slots.length) {
        setQueueSelection({ doctor: doctor.id, slot: slots[0].id });
      }
    }
  }, [doctors, selectedDayObj]);

  // Fetch queue data only when queueSelection is set
  useEffect(() => {
    if (!queueSelection || !selectedDayObj) {
      setPatients([]);
      return;
    }
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const resp = await fetch(
          `${API_URL}/appointments?scheduleId=${queueSelection.slot}&date=${selectedDayObj.date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let patients = await resp.json();
        // Normalize doctorId and slotId fields
        patients = patients.map((p: any) => ({
          ...p,
          doctorId: p.doctorId || p.doctor_id,
          slotId: p.slotId || p.schedule_id,
          queueNo: p.queueNo || p.queue_number,
          patient: p.patient,
          familyMember: p.familyMember,
        }));
        setPatients(patients.sort((a: AppointmentRow, b: AppointmentRow) => a.queueNo - b.queueNo));
      } catch (err) {
        setPatients([]);
      }
    })();
  }, [queueSelection, selectedDayObj]);

  // ... existing code ...
  // Remove the old effect that depended on isLoading
  // Add a new effect that runs when clinic is set; auth.currentUser is read inside
  useEffect(() => {
    if (auth.currentUser && clinic) {
      fetchData();
    }
  }, [clinic, fetchData]);
  // ... existing code ...

  const isDoctorsLoading = user && clinic && doctors.length === 0;

  if (isDoctorsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
      </div>
    );
  }

  const isQueueLoading = !user || !clinic || doctors.length === 0;
  if (isQueueLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" /> {/* Title shimmer */}
          <div className="h-10 w-1/2 bg-gray-200 rounded mb-6" /> {/* Dropdown shimmer */}
          <div className="h-16 w-full bg-gray-200 rounded mb-4" /> {/* Queue card shimmer */}
          <div className="h-16 w-full bg-gray-200 rounded mb-4" />
          <div className="h-16 w-full bg-gray-200 rounded mb-4" />
        </div>
      </div>
    );
  }

  // Function to add new family member
  const addNewFamilyMember = async () => {
    if (!fetchedPatient?.id || !newMemberForm.name || !newMemberForm.gender || !newMemberForm.dob || !newMemberForm.relation) {
      toast({
        title: "Missing fields",
        description: "Please fill all family member details",
        variant: "destructive",
      });
      return;
    }

    setAddingFamilyMember(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_URL}/patients/${fetchedPatient.id}/family-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newMemberForm.name,
          gender: newMemberForm.gender,
          dob: newMemberForm.dob,
          relation: newMemberForm.relation,
          source: "web",
        }),
      });

      if (response.ok) {
        const newMember = await response.json();
        toast({
          title: "Family member added",
          description: "Family member has been added successfully!",
        });
        
        // Refresh patient data to get updated family members
        const phone = '+91' + newPatient.phone.replace(/\D/g, '');
        const res = await fetch(`${API_URL}/patients/search/${encodeURIComponent(phone)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          const p = json.data ?? json;
          setFetchedPatient(p);
          setFamilyMembers(p.familyMembers || []);
          
          // Refresh booked schedule IDs to include any appointments for the new family member
          const date = getNextDateOfWeek(selectedDay, todayName);
          const resp3 = await fetch(
            `${API_URL}/appointments/patient/${p.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (resp3.ok) {
            const apptsRespAddFM = await resp3.json();
            const apptsArrAddFM = apptsRespAddFM.data ?? apptsRespAddFM;
            const dateAppointmentsAddFM = Array.isArray(apptsArrAddFM) ? apptsArrAddFM.filter((a: any) => a.date === date) : [];
            setBookedScheduleIds(dateAppointmentsAddFM.map((a: any) => a.schedule_id));
          }
          
          // Select the newly added family member
          setSelectedMember(newMember.id);
          setIsNewMember(false);
          
          // Clear the form
          setNewMemberForm({
            name: "",
            gender: "",
            dob: "",
            relation: "",
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to add family member");
      }
    } catch (error: any) {
      console.error("Error adding family member:", error);
      toast({
        title: "Failed to add family member",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setAddingFamilyMember(false);
    }
  };

  return (
    <Layout>
      <style jsx global>{`
        @media (min-width: 768px) {
          .appointments-sidebar {
            width: 12rem !important;
          }
        }
      `}</style>
      <div className="flex-1 flex">
        <div className="flex-1 p-6">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-[#164772]">My Queue</h1>
            <div className="flex items-center gap-4">
              {/* Doctor Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Doctor:</span>
                <div style={{ minWidth: '150px' }}>
                  {renderDoctorDropdown()}
                </div>
              </div>

              {/* Day+Date Selector - vertical dropdown */}
              {selectedDoctor && (
                <div className="flex items-center gap-2 mb-6" style={{ minHeight: '2.25rem' }}>
                  <span className="text-sm text-gray-600">Day:</span>
                  <Select
                    value={selectedDayObj?.date ?? ''}
                    onValueChange={val => {
                      const found = getNext7Days().find(d => d.date === val);
                      if (found) setSelectedDayObj(found);
                    }}
                  >
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {getNext7Days().map((d) => (
                        <SelectItem key={d.date} value={d.date}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Slot Selector - fixed width */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-sm text-gray-600">Slot:</span>
                <Select
                  value={selectedSlot ?? undefined}
                  onValueChange={val => setSelectedSlot(val)}
                >
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {slotsForSelectedDay.length > 0 ? (
                      slotsForSelectedDay.map((sch: DoctorSchedule) => (
                        <SelectItem key={sch.id} value={sch.id}>
                          {sch.start_time.slice(0,5)}–{sch.end_time.slice(0,5)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-slots" value="no-slots" disabled>
                        No slots for this day
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* STATUS FILTERS */}
          <div className="mb-6 flex space-x-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className={`flex-1 ${
    filterStatus === "all"
      ? "bg-[#164772] text-white hover:bg-[#143c62]"
      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
  }`}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "skipped" ? "default" : "outline"}
              onClick={() =>
                setFilterStatus(
                  filterStatus === "skipped" ? "all" : "skipped"
                )
              }
               className={`flex-1 ${
    filterStatus === "skipped"
      ? "bg-[#164772] text-white hover:bg-[#143c62]"
      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
  }`}
            >
              Skipped
            </Button>
            <Button
              variant={filterStatus === "cancelled" ? "default" : "outline"}
              onClick={() =>
                setFilterStatus(
                  filterStatus === "cancelled" ? "all" : "cancelled"
                )
              }
              className={`flex-1 ${
    filterStatus === "cancelled"
      ? "bg-[#164772] text-white hover:bg-[#143c62]"
      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
  }`}
            >
              Cancelled
            </Button>
          </div>

          {/* SERVING NOW */}
          {filterStatus === "all" && (
            <div className="mb-4">
              <div
                className="flex items-center bg-[#E0F2EF] text-[#1BBA8D] p-3 rounded-t-md cursor-pointer"
                onClick={() => toggleSection("serving")}
              >
                {expandedSections.serving ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
                <span className="font-medium ml-2">Serving now</span>
                <span className="ml-2 bg-white text-[#1BBA8D] w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {servingPatientsList.length}
                </span>
              </div>
              {expandedSections.serving && servingPatientsList.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">
                            Queue No.
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Patient Name
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Phone Number
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Sex
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Source
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {servingPatientsList.map((patient) => (
                          <React.Fragment key={patient.id}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-4">{patient.queueNo}</td>
                              <td className="p-4">{patient.patient?.fullName || patient.familyMember?.name || ""}</td>
                              <td className="p-4">
                                {patient.patient?.phone_number ||
                                  (patient.familyMember?.patient_id ? patientPhoneMap[patient.familyMember.patient_id] : "")}
                              </td>
                              <td className="p-4">{patient.patient?.gender
                                ? patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1).toLowerCase()
                                : (patient.familyMember?.gender
                                  ? patient.familyMember.gender.charAt(0).toUpperCase() + patient.familyMember.gender.slice(1).toLowerCase()
                                  : "")}</td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    patient.source === "web"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {patient.source}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-50">
                                      {patient.status === "waiting" && (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(patient.id, "serving")}
                                        >
                                          Call Next
                                        </DropdownMenuItem>
                                      )}
                                      {patient.status === "serving" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => handleStatusChange(patient.id, "completed")}
                                          >
                                            Complete
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setFollowUpDialogPatient({
                                                patientName: patient.patient?.fullName || patient.familyMember?.name || "",
                                                patientId: patient.patient?.id || patient.familyMember?.id || ""
                                              });
                                              setFollowUpDialogOpen(true);
                                            }}
                                          >
                                            Follow Up
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(patient.id, "skipped")}
                                      >
                                        Skip
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(patient.id, "cancelled")}
                                      >
                                        Cancel
                                      </DropdownMenuItem>
                                      {(patient.status === "skipped" ||
                                        patient.status === "cancelled" ||
                                        patient.status === "completed") && (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(patient.id, "waiting")}
                                        >
                                          Reopen
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}


                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* WAITING */}
          {filterStatus === "all" && (
            <div className="mb-4">
              <div
                className="flex items-center bg-[#FFF3E0] text-[#F59E0B] p-3 rounded-t-md cursor-pointer"
                onClick={() => toggleSection("waiting")}
              >
                {expandedSections.waiting ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
                <span className="font-medium ml-2">Waiting</span>
                <span className="ml-2 bg-white text-[#F59E0B] w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {waitingPatientsList.length}
                </span>
              </div>
              {expandedSections.waiting && waitingPatientsList.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">
                            Queue No.
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Patient Name
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Phone Number
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Sex
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Source
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitingPatientsList.map((patient) => (
                          <tr key={patient.id}>
                            <td className="p-4">{patient.queueNo}</td>
                            <td className="p-4">{patient.patient?.fullName || patient.familyMember?.name || ""}</td>
                            <td className="p-4">
                              {patient.patient?.phone_number ||
                                (patient.familyMember?.patient_id ? patientPhoneMap[patient.familyMember.patient_id] : "")}
                            </td>
                            <td className="p-4">
                              {patient.patient?.gender
                                ? patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1).toLowerCase()
                                : (patient.familyMember?.gender
                                    ? patient.familyMember.gender.charAt(0).toUpperCase() + patient.familyMember.gender.slice(1).toLowerCase()
                                    : "")
                            }
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patient.source === "web"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {patient.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="z-50"
                                  >
                                    {patient.status === "waiting" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "serving"
                                          )
                                        }
                                      >
                                        Call Next
                                      </DropdownMenuItem>
                                    )}
                                    {patient.status === "serving" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "completed"
                                          )
                                        }
                                      >
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "skipped"
                                        )
                                      }
                                    >
                                      Skip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "cancelled"
                                        )
                                      }
                                    >
                                      Cancel
                                    </DropdownMenuItem>
                                    {(patient.status === "skipped" ||
                                      patient.status === "cancelled" ||
                                      patient.status === "completed") && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "waiting"
                                          )
                                        }
                                      >
                                        Reopen
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* COMPLETED */}
          {filterStatus === "all" && completedPatientsList.length > 0 && (
            <div className="mb-4">
              <div
                className="flex items-center bg-gray-200 text-gray-600 p-3 rounded-t-md cursor-pointer"
                onClick={() => toggleSection("completed")}
              >
                {expandedSections.completed ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
                <span className="font-medium ml-2">Completed</span>
                <span className="ml-2 bg-white text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {completedPatientsList.length}
                </span>
              </div>
              {expandedSections.completed && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">
                            Queue No.
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Patient Name
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Phone Number
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Sex
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Source
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedPatientsList.map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-4">{patient.queueNo}</td>
                            <td className="p-4">{patient.patient?.fullName || patient.familyMember?.name || ""}</td>
                            <td className="p-4">
                              {patient.patient?.phone_number ||
                               (patient.familyMember?.patient_id ? patientPhoneMap[patient.familyMember.patient_id] : "")}
                            </td>
                            <td className="p-4">{patient.patient?.gender
  ? patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1).toLowerCase()
  : (patient.familyMember?.gender
      ? patient.familyMember.gender.charAt(0).toUpperCase() + patient.familyMember.gender.slice(1).toLowerCase()
      : "")}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patient.source === "web"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {patient.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="z-50"
                                  >
                                    {patient.status === "waiting" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "serving"
                                          )
                                        }
                                      >
                                        Call Next
                                      </DropdownMenuItem>
                                    )}
                                    {patient.status === "serving" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "completed"
                                          )
                                        }
                                      >
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "skipped"
                                        )
                                      }
                                    >
                                      Skip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "cancelled"
                                        )
                                      }
                                    >
                                      Cancel
                                    </DropdownMenuItem>
                                    {(patient.status === "skipped" ||
                                      patient.status === "cancelled" ||
                                      patient.status === "completed") && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            patient.id,
                                            "waiting"
                                          )
                                        }
                                      >
                                        Reopen
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SKIPPED */}
          {filterStatus === "skipped" && skippedPatientsList.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center bg-red-100 text-red-600 p-3 rounded-t-md">
                <span className="font-medium ml-2">Skipped</span>
                <span className="ml-2 bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {skippedPatientsList.length}
                </span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-600">
                          Queue No.
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Patient Name
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Phone Number
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Sex
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Doctor
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Source
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedPatientsList.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">{patient.queueNo}</td>
                          <td className="p-4">{patient.patient?.fullName || patient.familyMember?.name || ""}</td>
                          <td className="p-4">
                            {patient.patient?.phone_number ||
                             (patient.familyMember?.patient_id ? patientPhoneMap[patient.familyMember.patient_id] : "")}
                          </td>
                          <td className="p-4">{patient.patient?.gender
  ? patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1).toLowerCase()
  : (patient.familyMember?.gender
      ? patient.familyMember.gender.charAt(0).toUpperCase() + patient.familyMember.gender.slice(1).toLowerCase()
      : "")}</td>
                          <td className="p-4">{getDoctorNameById(patient.doctorId)}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.source === "web"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {patient.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="z-50"
                                >
                                  {patient.status === "waiting" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "serving"
                                        )
                                      }
                                    >
                                      Call Next
                                    </DropdownMenuItem>
                                  )}
                                  {patient.status === "serving" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "completed"
                                        )
                                      }
                                    >
                                      Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(patient.id, "skipped")
                                    }
                                  >
                                    Skip
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        patient.id,
                                        "cancelled"
                                      )
                                    }
                                  >
                                    Cancel
                                  </DropdownMenuItem>
                                  {(patient.status === "skipped" ||
                                    patient.status === "cancelled" ||
                                    patient.status === "completed") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "waiting"
                                        )
                                      }
                                    >
                                      Reopen
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CANCELLED */}
          {filterStatus === "cancelled" && cancelledPatientsList.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center bg-gray-300 text-gray-700 p-3 rounded-t-md">
                <span className="font-medium ml-2">Cancelled</span>
                <span className="ml-2 bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {cancelledPatientsList.length}
                </span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-600">
                          Queue No.
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                          Patient Name
                        </th>
                        <th className="text-left p-4 font-medium text-gray-600">
                            Phone Number
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Sex
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Doctor
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Source
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Actions
                          </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledPatientsList.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">{patient.queueNo}</td>
                          <td className="p-4">{patient.patient?.fullName || patient.familyMember?.name || ""}</td>
                          <td className="p-4">
                            {patient.patient?.phone_number ||
                             (patient.familyMember?.patient_id ? patientPhoneMap[patient.familyMember.patient_id] : "")}
                          </td>
                          <td className="p-4">{patient.patient?.gender
  ? patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1).toLowerCase()
  : (patient.familyMember?.gender
      ? patient.familyMember.gender.charAt(0).toUpperCase() + patient.familyMember.gender.slice(1).toLowerCase()
      : "")}</td>
                          <td className="p-4">{getDoctorNameById(patient.doctorId)}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.source === "web"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {patient.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="z-50"
                                >
                                  {patient.status === "waiting" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "serving"
                                        )
                                      }
                                    >
                                      Call Next
                                    </DropdownMenuItem>
                                  )}
                                  {patient.status === "serving" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "completed"
                                        )
                                      }
                                    >
                                      Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        patient.id,
                                        "skipped"
                                      )
                                    }
                                  >
                                    Skip
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        patient.id,
                                        "cancelled"
                                      )
                                    }
                                  >
                                    Cancel
                                  </DropdownMenuItem>
                                  {(patient.status === "skipped" ||
                                    patient.status === "cancelled" ||
                                    patient.status === "completed") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          patient.id,
                                          "waiting"
                                        )
                                      }
                                    >
                                      Reopen
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* BOTTOM ACTION BUTTONS */}
          <div className="sticky bottom-0 left-0 right-0 bg-white py-4 border-t mt-4 z-10 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const servingPatient = patients.find((p) => p.status === "serving");
                if (servingPatient) {
                  await handleStatusChange(servingPatient.id, "completed");
                  toast({
                    title: "Consultation Finished",
                    description: `${servingPatient.patient?.fullName || servingPatient.familyMember?.name || ""}'s consultation has been completed.`,
                  });
                } else {
                  toast({
                    title: "No Active Patient",
                    description: "There is no patient currently being served.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Finish Consultation
            </Button>
            <Button
              variant="outline"
              className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700"
              onClick={async () => {
                const servingPatient = patients.find((p) => p.status === "serving");
                if (servingPatient) {
                  await handleStatusChange(servingPatient.id, "skipped");
                  // After skipping, callNext to move next waiting to serving
                  await callNext();
                } else {
                  toast({
                    title: "No Active Patient",
                    description: "There is no patient currently being served.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Skip Patient
            </Button>
            <Button
              className="bg-[#1BBA8D] hover:bg-[#16A67D]"
              onClick={callNext}
            >
              Call Next
            </Button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-80 border-l p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#164772]">Add Patient</h2>

            {/* DOCTOR SCHEDULE DRAWER */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-6">
                  <Menu className="h-2 w-2 mr-0" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[400px] sm:w-[540px] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Doctor&apos;s Schedule</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Doctor Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Doctor :
                    </label>
                    <Select
                      value={selectedScheduleDoctor}
                      onValueChange={setSelectedScheduleDoctor}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.filter(doctor => !doctor.id.startsWith('dummy')).map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} ({doctor.specialty})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Today's Availability */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">
                        Today&apos;s Availability :
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowAddSlot(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                     {getTodaySlots().map((slot: DoctorSchedule) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                        >
                          {editingSlot === slot.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-2 flex-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <Select
                                  value={editingStartTime}
                                  onValueChange={setEditingStartTime}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Start time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-gray-500">to</span>
                                <Select
                                  value={editingEndTime}
                                  onValueChange={setEditingEndTime}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="End time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600"
                                onClick={() => handleSaveSlot(slot.id)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    handleEditSlot(slot.id, `${slot.start_time} - ${slot.end_time}`)
                                  }
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500"
                                  onClick={() => handleDeleteSlot(slot.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add new slot form */}
                      {showAddSlot && (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-blue-50">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <Select
                            value={newSlotStartTime}
                            onValueChange={setNewSlotStartTime}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500">to</span>
                          <Select
                            value={newSlotEndTime}
                            onValueChange={setNewSlotEndTime}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-green-600"
                            onClick={handleAddSlot}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => {
                              setShowAddSlot(false);
                              setNewSlotStartTime("");
                              setNewSlotEndTime("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other Day's Availability */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Other Day&apos;s Availability :
                    </h3>
                    <div className="space-y-3">
                      {DAYS_OF_WEEK.filter(day => day.trim() !== todayName).map((day) => {
                        const daySchedules = selectedScheduleDoctorSchedules?.filter(s => s.day_of_week === day) || [];
                        
                        return (
                          <div key={day} className="border rounded-md p-3 bg-gray-50">
                            <h4 className="font-medium mb-2">{day}</h4>
                            {daySchedules.length > 0 ? (
                              <div className="space-y-2">
                                {daySchedules.map(schedule => (
                                  <div key={schedule.id} className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span>{schedule.start_time} - {schedule.end_time}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No schedules</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        Booking Settings
                      </h3>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allow-booking" className="text-sm">
                          Allow Online Booking
                        </Label>
                        <Switch
                          id="allow-booking"
                          checked={bookingSettings.onlineBookingEnabled}
                          onCheckedChange={(checked) =>
                            setBookingSettings({
                              ...bookingSettings,
                              onlineBookingEnabled: checked,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="booking-time"
                          className="text-sm text-gray-600 block mb-2"
                        >
                          Booking Opening Time
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="booking-time"
                            value="9:00 AM"
                            readOnly
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* ADD PATIENT FORM */}
          <div className="space-y-4">
            {/* Mobile + Verify */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Mobile Number
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Mobile Number"
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                />
                <Button
                  variant="outline"
                  className="bg-white text-[#1BBA8D] border border-[#687c77] hover:bg-[#f0fdfb]"
                  onClick={verifyPhone}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying…' : 'Verify'}
                </Button>

              </div>
            </div>

          


            {/* If this is an existing patient, show family-members dropdown */}
            {patientExists === true && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                  Select Member
                  </label>
                  <Select
                  value={selectedMember}
                    onValueChange={(val) => {
                    setSelectedMember(val);
                      if (val === "self") {
                        // self selected
                        setNewPatient((prev) => ({
                          ...prev,
                        familyMemberId: "",
                          name: fetchedPatient.fullName || "",
                          sex: fetchedPatient.gender
                            ? fetchedPatient.gender.charAt(0).toUpperCase() + fetchedPatient.gender.slice(1).toLowerCase()
                            : "",
                          dob: fetchedPatient.dob || "",
                        }));
                      setIsNewMember(false);
                    } else if (val === "add-new") {
                      // add new member selected
                      setIsNewMember(true);
                      setNewPatient((prev) => ({
                        ...prev,
                        familyMemberId: "",
                        name: "",
                        sex: "",
                        dob: "",
                      }));
                      } else {
                      // existing family member selected
                        const fm = familyMembers.find((f) => f.id === val);
                        setNewPatient((prev) => ({
                          ...prev,
                        familyMemberId: val,
                          name: fm?.name || "",
                          sex: fm?.gender
                            ? fm.gender.charAt(0).toUpperCase() + fm.gender.slice(1).toLowerCase()
                            : "",
                          dob: fm?.dob || "",
                        }));
                      setIsNewMember(false);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                      {familyMembers.map((fm) => (
                        <SelectItem key={fm.id} value={fm.id}>
                          {fm.name} ({fm.relation})
                        </SelectItem>
                      ))}
                    <SelectItem value="add-new">+ Add Family Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Add Family Member Form */}
            {patientExists === true && isNewMember && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Add Family Member</h3>
                
                {/* Name */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Name</label>
                  <Input
                    placeholder="Family member name"
                    value={newMemberForm.name}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, name: e.target.value })
                    }
                  />
                </div>

                {/* Gender + DOB */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Gender</label>
                    <Select
                      value={newMemberForm.gender}
                      onValueChange={(val) =>
                        setNewMemberForm({ ...newMemberForm, gender: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">DOB</label>
                    <Input
                      type="date"
                      value={newMemberForm.dob}
                      onChange={(e) =>
                        setNewMemberForm({ ...newMemberForm, dob: e.target.value })
                      }
                      className="h-9 px-1 text-sm"
                    />
                  </div>
                </div>

                {/* Relation */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Relation</label>
                  <Input
                    placeholder="e.g., Father, Mother, Son, Daughter"
                    value={newMemberForm.relation}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, relation: e.target.value })
                    }
                  />
                </div>

                {/* Add Family Member Button */}
                <Button
                  className="w-full bg-[#1BBA8D] hover:bg-[#16A67D]"
                  onClick={addNewFamilyMember}
                  disabled={addingFamilyMember}
                >
                  {addingFamilyMember ? "Adding..." : "Add Family Member"}
                </Button>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Name</label>
              <Input
                placeholder="Name"
                value={newPatient.name}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, name: e.target.value })
                }
              />
            </div>

            {/* Sex + DOB */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Sex</label>
                <Select
                  value={newPatient.sex}
                  onValueChange={(val) =>
                    setNewPatient({ ...newPatient, sex: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">DOB</label>
                <Input
  type="date"
  value={newPatient.dob}
  onChange={(e) =>
    setNewPatient({ ...newPatient, dob: e.target.value })
  }
  className="h-9 px-1 text-sm appearance-auto"
  style={{
    paddingRight: "0.75rem",  // make space for calendar icon
  }}
/>

              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Doctor Selection
              </label>
              <Select
                value={newPatient.doctor}
                onValueChange={(val) =>
                  setNewPatient({ ...newPatient, doctor: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {doctors.filter(doctor => !doctor.id.startsWith('dummy')).map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.specialty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                        {/* ─── Day selector ─────────────────────────── */}
            {newPatient.doctor && (
              <div>
                <label className="text-sm block mb-1">Day</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(d=>{
                      const date = getNextDateOfWeek(d, todayName);
                      const label = d === todayName ? `Today (${date})` : `${d} (${date})`;
                      return (
                        <SelectItem key={d} value={d}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ─── Slot selector for selectedDay ───────── */}
            {formSchedules.some(s => s.day_of_week.trim().toLowerCase() === selectedDay.toLowerCase()) && (
              <div>
                <label className="text-sm block mb-1">Slot</label>
                {/* Remove the debug section here */}
                {/* Debug: Print bookedScheduleIds and slot IDs */}
                {(() => {
                  console.log('bookedScheduleIds:', bookedScheduleIds);
                  const slotIds = formSchedules
                    .filter(s => s.day_of_week.trim().toLowerCase() === selectedDay.toLowerCase())
                    .map(s => s.id);
                  console.log('Slot IDs for selected day:', slotIds);
                  return null;
                })()}
                
                <Select
                  value={newPatient.slotId || ''}
                  onValueChange={v => setNewPatient({...newPatient, slotId: v})}
                >
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                  {/* Debug: Log formSchedules data */}
                  {(() => {
                    console.log('=== FORM SCHEDULES DEBUG ===');
                    console.log('formSchedules:', formSchedules);
                    console.log('selectedDay:', selectedDay);
                    console.log('todayName:', todayName);
                    console.log('Slots for selectedDay:', formSchedules.filter(s => s.day_of_week.trim().toLowerCase() === selectedDay.toLowerCase()));
                    console.log('=== END FORM SCHEDULES DEBUG ===');
                    return null;
                  })()}
                  
                  {formSchedules
                      .filter(s => s.day_of_week.trim().toLowerCase() === selectedDay.toLowerCase())
                      .filter(s => {
                        // Extract the selected date from the dropdown label
                        const selectedDayObj = DAYS_OF_WEEK.map(d => {
                          const date = getNextDateOfWeek(d, todayName);
                          return { day: d, date };
                        }).find(obj => obj.day === selectedDay);
                        const selectedDate = selectedDayObj ? selectedDayObj.date : null;
                        const systemDate = new Date().toISOString().slice(0, 10);

                        if (!selectedDate) {
                          // If selectedDate is null, do not show any slots
                          return false;
                        }
                        if (selectedDate === systemDate) {
                          // For today, only show slots whose end time is after now
                          const now = new Date();
                          const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                          const slotEnd = s.end_time.split(':').slice(0,2).join(':');
                          const endMins = toMinutes(slotEnd);
                          const currentMins = toMinutes(currentTime);
                          return endMins > currentMins;
                        }
                        if (selectedDate > systemDate) {
                          return true;
                        }
                        return false;
                      })
                      .map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full bg-[#1BBA8D] hover:bg-[#16A67D]"
              onClick={handleAddPatient}
            >
              Add in Queue
            </Button>
          </div>

          {/* EMERGENCY MESSAGE SECTION */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-[#164772]">
                Emergency Status
              </h3>
              <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
            </div>

            {isEmergency && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Emergency Message
                  </label>
                  <Textarea
                    placeholder="Enter message to display to waiting patients"
                    value={emergencyMessage}
                    onChange={(e) => setEmergencyMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    if (emergencyMessage) {
                      toast({
                        title: "Emergency Message Sent",
                        description:
                          "Message has been sent to all waiting patients.",
                      });
                    } else {
                      setEmergencyMessage(
                        "Doctor is currently unavailable due to emergency."
                      );
                    }
                  }}
                >                  Send to Patients
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOLLOW UP DIALOG - Render at the end so it overlays everything */}
      <Dialog open={followUpDialogOpen} onOpenChange={(open) => {
        setFollowUpDialogOpen(open);
        if (!open) setFollowUpDialogPatient(null);
      }}>
        <DialogContent>
          <DialogTitle>Schedule Follow Up</DialogTitle>
          {followUpDialogPatient && (
            <FollowUpForm
              patientName={followUpDialogPatient.patientName}
              patientId={followUpDialogPatient.patientId}
              doctorId={selectedDoctor}
              doctorSchedules={doctors.find(d => d.id === selectedDoctor)?.schedules || []}
              onSuccess={async () => {
                setFollowUpDialogOpen(false);
                setFollowUpDialogPatient(null);
                await fetchQueue();
                toast({
                  title: "Follow-up Scheduled",
                  description: "The follow-up appointment has been booked.",
                  variant: "default",
                });
              }}
              onCancel={() => {
                setFollowUpDialogOpen(false);
                setFollowUpDialogPatient(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster />
    </Layout>
  );
}