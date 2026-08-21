// File: app/doctors/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  ReactNode,
} from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, Calendar } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { auth } from "@/firebase";
import { toast } from "sonner";

// Import each shadcn/ui component from its individual file
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Layout from "@/components/layout"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
console.log("🚀 Using API_URL =", API_URL);
// --------------------
// Type Definitions
// --------------------
type Gender = "Male" | "Female";

interface TimeSlot {
  start: string; // "HH:MM" format
  end: string;   // "HH:MM" format
  id?: string;   // Preserve ID when editing existing slots
  maxQueue?: number;
}

interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

interface DoctorSchedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  doctor_id: string;
  maxQueue?: number;
}

interface Doctor {
  id: string;
  name: string;
  gender: Gender;
  specialty: string;
  email: string;
  qualification?: string;
  phone?: string;
  date_of_birth?: string;
  experience_years?: number;
  avatar_url?: string;
  clinic_id: string;
  created_at: string;
  schedules: DoctorSchedule[];
}

// --------------------
// Helper Constants & Functions
// --------------------
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function createEmptySchedule(): WeeklySchedule {
  const sched: WeeklySchedule = {};
  for (const day of DAYS_OF_WEEK) {
    sched[day] = [];
  }
  return sched;
}

// Convert backend schedules to frontend format
function convertSchedulesToWeeklySchedule(
  schedules: DoctorSchedule[] = []
): WeeklySchedule {
  const weekly = createEmptySchedule();
  schedules.forEach((s) => {
    // backend might send day_of_week or dayOfWeek
    const rawDay = (s as any).day_of_week ?? (s as any).dayOfWeek;
    if (typeof rawDay !== "string" || !rawDay) return;

    const dayKey =
      rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();
    if (!weekly[dayKey]) weekly[dayKey] = [];

    // backend might send start_time / end_time or startTime / endTime
    const rawStart = (s as any).start_time ?? (s as any).startTime ?? (s as any).from;
    const rawEnd = (s as any).end_time ?? (s as any).endTime ?? (s as any).to;
    if (typeof rawStart !== "string" || typeof rawEnd !== "string") return;
    const start = rawStart.slice(0,5); // "HH:MM"
    const end   = rawEnd.slice(0,5);
    // Fix: always parse maxQueue as a number if present
    const maxQueueRaw = (s as any).max_queue ?? (s as any).maxQueue;
    const maxQueue = typeof maxQueueRaw === 'number'
      ? maxQueueRaw
      : (typeof maxQueueRaw === 'string' && maxQueueRaw !== '' ? Number(maxQueueRaw) : undefined);
    weekly[dayKey].push({
      start,
      end,
      id: s.id,
      maxQueue,
    });
  });
  return weekly;
}

// Convert frontend schedule to backend format
function convertWeeklyScheduleToSchedules(weeklySchedule: WeeklySchedule, doctorId: string): DoctorSchedule[] {
  const schedules: DoctorSchedule[] = [];
  for (const [day, slots] of Object.entries(weeklySchedule)) {
    for (const slot of slots) {
      // If the slot has an ID stored (from previous save), use it, otherwise generate a new one
      const slotId = (slot as any).id || crypto.randomUUID();
      schedules.push({
        id: slotId,
        day_of_week: day,
        start_time: slot.start.length === 5 ? slot.start + ":00" : slot.start,
        end_time: slot.end.length   === 5 ? slot.end   + ":00" : slot.end,
        doctor_id: doctorId,
        maxQueue: slot.maxQueue ?? 5,
      });
    }
  }
  return schedules;
}

function hasOverlap(slots: { start: string; end: string }[]): boolean {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) {
      return true;
    }
  }
  return false;
}

// --------------------
// Main Page Component
// --------------------
export default function DoctorsPage() {
  // State: doctors list
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { clinic, isLoading, user } = useAuth();

  // Tabs and search
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Create/Edit doctor dialog
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Schedule dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] =
    useState<boolean>(false);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);

  // Helper to fetch doctors
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_URL}/doctors`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Failed to fetch doctors: ${response.status}`);
      const json = await response.json();
      const doctorsList = json.data ?? json;
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      toast.error('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors on mount and when clinic/isLoading changes
  useEffect(() => {
    if (!isLoading && clinic && user && auth.currentUser) {
      fetchDoctors();
    }
  }, [isLoading, clinic, user]);

  useEffect(() => {
    function onFocus() {
      if (clinic) fetchDoctors();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [clinic]);

  // Derived specialties (alphabetical)
  const specialties: string[] = Array.from(
    new Set(doctors.map((d) => d.specialty))
  ).sort((a, b) => a.localeCompare(b));

  // Filtered doctors for table
  const filteredDoctors = doctors
    .filter((doc) => (activeTab === "All" ? true : doc.specialty === activeTab))
    .filter((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handlers: Create/Edit doctor
  function handleCreateClick() {
    setEditingDoctor(null);
    setDialogOpen(true);
  }
  function handleEditClick(doc: Doctor) {
    setEditingDoctor(doc);
    setDialogOpen(true);
  }
  async function handleSaveDoctor(updated: Doctor) {
    if (!clinic) {
      toast.error('You must be logged in to save doctors');
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const url = editingDoctor 
        ? `${API_URL}/doctors/${updated.id}`
        : `${API_URL}/doctors`;
      const method = editingDoctor ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updated.name,
          gender: updated.gender,
          specialty: updated.specialty,
          email: updated.email,
          qualification: updated.qualification,
          phone: updated.phone,
          date_of_birth: updated.date_of_birth,
          experience_years: updated.experience_years,
          avatar_url: updated.avatar_url,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save doctor');
      }
      toast.success(editingDoctor ? 'Doctor updated successfully' : 'Doctor created successfully');
    setDialogOpen(false);
    setEditingDoctor(null);
      await fetchDoctors(); // Always refresh list after add/edit
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Failed to save doctor. Please try again.');
    }
  }
  async function handleDeleteDoctor(id: string) {
    if (!clinic) {
      toast.error('You must be logged in to delete doctors');
      return;
    }
    try {
      // First fetch the doctor to get all schedules
      const token = await auth.currentUser?.getIdToken();
      const doctorResponse = await fetch(`${API_URL}/doctors/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
      });
      
      if (!doctorResponse.ok) {
        throw new Error(`Failed to fetch doctor data for deletion: ${doctorResponse.status}`);
      }
      
      const doctorData = await doctorResponse.json();
      console.log('Doctor data for deletion:', doctorData);
      
      // Check if the doctor has schedules
      const schedules = doctorData.data.schedules || [];
      console.log(`Doctor ${id} has ${schedules.length} schedules that need to be deleted first`);
      
      // Delete each schedule before deleting the doctor
      if (schedules.length > 0) {
        const deletePromises = schedules.map((schedule: { id: string }) => {
          console.log(`Deleting schedule with id: ${schedule.id}`);
          return fetch(`${API_URL}/doctors/${id}/schedules/${schedule.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to delete schedule ${schedule.id}: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log(`Successfully deleted schedule ${schedule.id}:`, data);
            return data;
          });
        });
        
        // Wait for all schedule deletions to complete
        await Promise.all(deletePromises);
        console.log('All schedules deleted successfully');
      }
      
      // Now delete the doctor
      const response = await fetch(`${API_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete doctor: ${response.status}`);
      }
      
      toast.success('Doctor deleted successfully');
      setDialogOpen(false);
      setEditingDoctor(null);
      await fetchDoctors(); // Always refresh list after delete
    } catch (error) {
      console.error('Error deleting doctor:', error);
      if (error instanceof Error) {
        toast.error(`Failed to delete doctor: ${error.message}`);
      } else {
        toast.error('Failed to delete doctor. Please try again.');
      }
    }
  }
  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingDoctor(null);
  }

  // Handlers: Schedule dialog
  const handleScheduleClick = async (doc: Doctor) => {
    const token = await auth.currentUser?.getIdToken();
    try {
      // fetch fresh doctor + schedules
      const res = await fetch(
        `${API_URL}/doctors/${doc.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      console.log("📥 raw /doctors/:id response:", json);
      // some APIs nest twice ( { data: { data: doctor } } ), some once ( { data: doctor } ), some no-nest
      const unwrapped =
        json.data?.data   // e.g. { data: { data: doctor } }
        ?? json.data     //    or   { data: doctor }
        ?? json;         //    or   doctor
      console.log("🔍 unwrapped doctor object:", unwrapped);

      const freshDoc: Doctor = unwrapped;
      setScheduleDoctor(freshDoc);
    } catch (error) {
      console.error("Failed to refresh schedule:", error);
      // fallback to whatever we already had
      setScheduleDoctor(doc);
    }
    setScheduleDialogOpen(true);
  }

  async function handleSaveSchedule(updatedSchedules: DoctorSchedule[]) {
    if (!clinic || !scheduleDoctor) {
      toast.error('You must be logged in to save schedules');
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // Find the IDs of slots that have been removed
      const existingIds = new Set((scheduleDoctor.schedules || []).map(s => s.id));
      const updatedIds = new Set(updatedSchedules.map(s => s.id).filter(id => id)); // Filter out undefined/null IDs
      
      // Identify slots to delete (exist in original but not in updated set)
      const slotsToDelete = [...existingIds].filter(id => !updatedIds.has(id));
      console.log('Slots to delete:', slotsToDelete);
      
      // Delete removed slots
      if (slotsToDelete.length > 0) {
        const deletePromises = slotsToDelete.map(id => {
          console.log(`Deleting schedule with id: ${id}`);
          return fetch(`${API_URL}/doctors/${scheduleDoctor.id}/schedules/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to delete schedule ${id}: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log(`Successfully deleted schedule ${id}:`, data);
            return data;
          });
        });
        
        await Promise.all(deletePromises);
        console.log('All delete operations completed');
      }
      
      // For each slot in the updated schedule, either update if it has an ID or create if it's new
      const upsertPromises = (updatedSchedules || []).map(schedule => {
        // If it has an existing ID, it's an update; otherwise it's a new schedule
        const isNew = !schedule.id || !existingIds.has(schedule.id);
        const hhmm = (schedule.start_time ?? "").slice(0, 5);
        const hhmmEnd = (schedule.end_time ?? "").slice(0, 5);
        
        if (isNew) {
          // Create new schedule
          return fetch(`${API_URL}/doctors/${scheduleDoctor.id}/schedules`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doctorId:  scheduleDoctor.id,
              dayOfWeek: schedule.day_of_week,
              startTime: schedule.start_time.slice(0,5),
              endTime:   schedule.end_time.slice(0,5),
              maxQueue: schedule.maxQueue ?? 5,
            }),
          })
          .then(async res => {
               if (!res.ok) {
                 const text = await res.text();
                 console.error('Create slot failed:', text);
                 throw new Error(`Failed to create slot: ${res.status}`);
                }
                return res.json();
              });
        } else {
          // Update existing schedule
          console.log(`Updating schedule with id: ${schedule.id}`);
          return fetch(`${API_URL}/doctors/${scheduleDoctor.id}/schedules/${schedule.id}`, {
            method: 'PATCH',  // NestJS typically uses PATCH for updates
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              
              dayOfWeek: schedule.day_of_week,
              startTime: schedule.start_time.slice(0,5),
              endTime:   schedule.end_time.slice(0,5),
              maxQueue: schedule.maxQueue ?? 5,
            }),
          })
          .then(async res => {
            if (!res.ok) {
              const text = await res.text();
              console.error('Update schedule error body:', text);
              throw new Error(`Failed to update schedule ${schedule.id}: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log(`Successfully updated schedule ${schedule.id}:`, data);
            return data;
          });
        }
      });
      
      // Wait for all operations to complete and handle errors properly
      try {
        const results = await Promise.all(upsertPromises);
        console.log('Schedule update API calls completed successfully', results);
        toast.success('Schedule updated successfully');
        setScheduleDialogOpen(false);
        setScheduleDoctor(null);
        
         // Refresh your local doctors list (and with it, each doctor's schedules)
        setTimeout(async () => {
          await fetchDoctors(); // Refresh list after schedule change
          console.log('Doctor list refreshed after schedule update');
        }, 500);
      } catch (error) {
        console.error('Error in upsert operations:', error);
        throw error; // Pass to outer catch block
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      
      // Show more detailed error message to help with troubleshooting
      if (error instanceof Error) {
        toast.error(`Failed to save schedule: ${error.message}`);
      } else {
        toast.error('Failed to save schedule. Please try again.');
      }
    }
  }
  function handleCloseSchedule() {
    setScheduleDialogOpen(false);
    setScheduleDoctor(null);
  }

  if (isLoading || !clinic || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164772]"></div>
      </div>
    );
  }

  return (
    <Layout>
      <style jsx global>{`
        @media (min-width: 768px) {
          .appointments-sidebar {
            width: 12rem !important;
          }
        }
      `}</style>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {/* Loader overlay if loading */}
          {(isLoading || !clinic || loading) ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164772]"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  Doctors
                </h1>
              </div>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(val: string) => setActiveTab(val)}
                className="mb-4"
              >
                <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  {specialties.map((spec) => (
                    <TabsTrigger key={spec} value={spec}>
                      {spec}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  className="inline-flex items-center justify-center space-x-2 bg-[#164772] hover:bg-[#0f3359] text-white px-4 py-2 rounded-md"
                  onClick={handleCreateClick}
                >
                  <Plus size={16} /> <span>Create Doctor</span>
                </Button>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pr-10"
                  />
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              {/* Doctors Table */}
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredDoctors.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {/* Name & Gender */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {doc.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.gender}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Specialty & Qualification */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {doc.specialty}
                          </div>
                        </td>
                        {/* Contact Details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {doc.email}
                          </div>
                        </td>
                        {/* Actions: View Queue, Edit, Schedule */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="inline-flex items-center justify-center bg-[#1BBA8B] hover:bg-[#15996d] text-white px-3 py-1 rounded-md"
                              onClick={() => {
                                /* Navigate to `/queue?doctorId=${doc.id}` if desired */
                              }}
                            >
                              View Queue
                            </Button>
                            <Button
                              size="sm"
                              className="inline-flex items-center justify-center space-x-1 bg-[#1BBA8B] hover:bg-[#15996d] text-white px-3 py-1 rounded-md"
                              onClick={() => handleEditClick(doc)}
                            >
                              <Edit size={14} /> <span>Edit Details</span>
                            </Button>
                            <Button
                              size="sm"
                              className="inline-flex items-center justify-center space-x-1 bg-[#1BBA8B] hover:bg-[#15996d] text-white px-3 py-1 rounded-md"
                              onClick={() => handleScheduleClick(doc)}
                            >
                              <Calendar size={14} /> <span>Schedule</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDoctors.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          {doctors.length === 0 ? "No doctors found." : "No matching doctors found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        {/* === Create / Edit Doctor Dialog === */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? "Edit Doctor" : "Create Doctor"}
              </DialogTitle>
              <DialogDescription>
                {editingDoctor
                  ? "Update the doctor's information below."
                  : "Fill out the form to add a new doctor."}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-4">
              <DoctorForm
                initialData={editingDoctor}
                onSave={handleSaveDoctor}
                onCancel={handleCloseDialog}
                onDelete={handleDeleteDoctor}
              />
            </div>
          </DialogContent>
        </Dialog>
        {/* === Schedule Dialog === */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="sm:max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Doctor&apos;s Schedule</DialogTitle>
              <DialogDescription>
                Define availability slots for {scheduleDoctor?.name}.
              </DialogDescription>
            </DialogHeader>
            {scheduleDoctor && (
              <div className="max-h-[70vh] overflow-y-auto pr-4">
                <ScheduleForm
                  initialSchedule={scheduleDoctor.schedules || []}
                  onSave={handleSaveSchedule}
                  onCancel={handleCloseSchedule}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// --------------------
// DoctorForm Component (Create/Edit Doctor)
// --------------------
interface DoctorFormProps {
  initialData: Doctor | null;
  onSave: (data: Doctor) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

function DoctorForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
}: DoctorFormProps) {
  const [name, setName] = useState<string>(initialData?.name || "");
  const [gender, setGender] = useState<Gender>(
    initialData?.gender || "Male"
  );
  const [specialty, setSpecialty] = useState<string>(
    initialData?.specialty || ""
  );
  const [email, setEmail] = useState<string>(initialData?.email || "");

  useEffect(() => {
    setName(initialData?.name || "");
    setGender(initialData?.gender || "Male");
    setSpecialty(initialData?.specialty || "");
    setEmail(initialData?.email || "");
  }, [initialData]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!specialty.trim()) {
      alert("Specialty is required.");
      return;
    }
    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    const newDoctor: Doctor = {
      id: initialData?.id || Date.now().toString(),
      name: name.trim(),
      gender,
      specialty: specialty.trim(),
      email: email.trim(),
      clinic_id: initialData?.clinic_id || "",
      created_at: initialData?.created_at || new Date().toISOString(),
      schedules: initialData?.schedules || [],
    };
    onSave(newDoctor);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Name */}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Full Name"
          required
        />
      </div>

      {/* Gender */}
      <div>
        <Label>Gender</Label>
        <RadioGroup
          onValueChange={(value: string) => setGender(value as Gender)}
          value={gender}
          className="flex space-x-6 mt-1"
        >
          <Label htmlFor="gender-male" className="flex items-center space-x-1">
            <RadioGroupItem id="gender-male" value="Male" />
            <span>Male</span>
          </Label>
          <Label
            htmlFor="gender-female"
            className="flex items-center space-x-1"
          >
            <RadioGroupItem id="gender-female" value="Female" />
            <span>Female</span>
          </Label>
        </RadioGroup>
      </div>

      {/* Specialty */}
      <div>
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          id="specialty"
          name="specialty"
          type="text"
          value={specialty}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSpecialty(e.target.value)
          }
          placeholder="e.g., Pediatrics, Cardiology"
          required
        />
      </div>

      {/* Qualification */}



      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          placeholder="e.g., doctor@example.com"
          required
        />
      </div>


      {/* Footer Buttons */}
      <DialogFooter className="mt-6 flex justify-end space-x-2 pb-4">
        {initialData && (
          <Button
            type="button"
            className="inline-flex items-center justify-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            onClick={() => onDelete(initialData.id)}
          >
            <Trash2 size={14} />
            <span>Delete Doctor</span>
          </Button>
        )}

        <Button
          type="button"
          className="inline-flex items-center justify-center bg-[#1BBA8B] hover:bg-[#15996d] text-white px-4 py-2 rounded-md"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="inline-flex items-center justify-center bg-[#164772] hover:bg-[#0f3359] text-white px-4 py-2 rounded-md"
        >
          {initialData ? "Update Doctor" : "Add Doctor"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// --------------------
// ScheduleForm Component (Edit Schedule Only)
// --------------------
interface ScheduleFormProps {
  initialSchedule: Doctor['schedules'];
  onSave: (updatedSchedule: Doctor['schedules']) => void;
  onCancel: () => void;
}

function ScheduleForm({
  initialSchedule,
  onSave,
  onCancel,
}: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    // Convert backend schedules to frontend format
    return convertSchedulesToWeeklySchedule(initialSchedule);
  });

  useEffect(() => {
    setSchedule(convertSchedulesToWeeklySchedule(initialSchedule));
  }, [initialSchedule]);

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
    () => {
      // build the weekly schedule once
      const weekly = convertSchedulesToWeeklySchedule(initialSchedule);
      const init: Record<string, boolean> = {};
      for (const day of DAYS_OF_WEEK) {
        // auto‐open only if there are slots for that day
        init[day] = (weekly[day]?.length || 0) > 0;
      }
      return init;
    }
  );
  useEffect(() => {
    const init: Record<string, boolean> = {};
    for (const day of DAYS_OF_WEEK) {
      init[day] = schedule[day].length > 0;
    }
    setExpandedDays(init);
  }, [schedule]);

  const [errorMsg, setErrorMsg] = useState<string>("");

  function addSlot(day: string) {
    setErrorMsg("");
    setSchedule((prev) => {
      // New slots have empty time fields and will get an ID when saved
      const newSlots = [...prev[day], { start: "", end: "" }];
      console.log(`Added new slot for ${day}`, newSlots);
      return { ...prev, [day]: newSlots };
    });
  }

  function updateSlot(
    day: string,
    index: number,
    field: "start" | "end" | "maxQueue",
    value: string | number
  ) {
    setErrorMsg("");
    setSchedule((prev) => {
      const slots = [...prev[day]];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, [day]: slots };
    });
  }

  function deleteSlot(day: string, index: number) {
    setErrorMsg("");
    setSchedule((prev) => {
      const slots = [...prev[day]];
      if (index < 0 || index >= slots.length) {
        console.error(`Invalid index ${index} for slots array with length ${slots.length}`);
        return prev; // Return unchanged if index is invalid
      }
      
      // Store the slot being deleted for logging
      const slotToDelete = slots[index];
      console.log(`Deleting slot: ${JSON.stringify(slotToDelete)} at index ${index} for ${day}`);
      
      // Remove the slot at the specified index
      slots.splice(index, 1);
      console.log(`Slots after deletion:`, slots);
      
      // Return updated state
      return { ...prev, [day]: slots };
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      // Clear previous error messages
      setErrorMsg("");
      
      // Validate each slot
      for (const day of DAYS_OF_WEEK) {
        for (const slot of schedule[day]) {
          if (!slot.start || !slot.end) {
            setErrorMsg(`All time slots for ${day} must have start and end times.`);
            return;
          }
          if (slot.end <= slot.start) {
            setErrorMsg(
              `On ${day}, end time (${slot.end}) must be after start time (${slot.start}).`
            );
            return;
          }
        }
      }

      // Add slot overlap validation
      for (const day of DAYS_OF_WEEK) {
        if (hasOverlap(schedule[day])) {
          setErrorMsg(`Overlapping slots found for ${day}.`);
          return;
        }
      }

      // Log what we're saving
      console.log('Saving schedule:', JSON.stringify(schedule));

      // Convert frontend schedule format to backend format
      const updatedSchedules = convertWeeklyScheduleToSchedules(schedule, initialSchedule[0]?.doctor_id || "");
      console.log('Converted to DoctorSchedule format:', JSON.stringify(updatedSchedules));
      
      // Call the save handler passed from parent
      onSave(updatedSchedules);
    } catch (error) {
      console.error('Error in schedule form submission:', error);
      setErrorMsg(`An error occurred while saving: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Error Message */}
      {errorMsg && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Schedule for All Week Days
        </h3>
        <button
          type="submit"
          className="inline-flex items-center justify-center bg-[#164772] hover:bg-[#0f3359] text-white px-4 py-2 rounded-md"
        >
          Save Schedule
        </button>
      </div>

      {DAYS_OF_WEEK.map((day) => (
        <div key={day} className="mb-4">
          <button
            type="button"
            className="w-full flex justify-between items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
            onClick={() =>
              setExpandedDays((prev) => ({
                ...prev,
                [day]: !prev[day],
              }))
            }
          >
            <span className="text-gray-700 dark:text-gray-200">{day}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedDays[day] ? "▲" : "▼"}
            </span>
          </button>
          {expandedDays[day] && (
            <div className="mt-2 pl-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Slots for {day}
                </p>
                <Button
                  size="sm"
                  className="inline-flex items-center justify-center bg-[#1BBA8B] hover:bg-[#15996d] text-white px-3 py-1 rounded-md"
                  onClick={() => addSlot(day)}
                >
                  + Add Slot
                </Button>
              </div>
              {schedule[day].length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No slots added.
                </p>
              )}
              {schedule[day].map((slot, idx) => (
                <div
                  key={`${day}-${idx}`}
                  className="flex items-center space-x-2 mb-2"
                >
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) =>
                      updateSlot(day, idx, "start", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-gray-500 dark:text-gray-400">–</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) =>
                      updateSlot(day, idx, "end", e.target.value)
                    }
                    className="w-32"
                  />
                  <Input
                    type="number"
                    value={typeof slot.maxQueue === 'number' ? slot.maxQueue : ''}
                    min={1}
                    onChange={e => updateSlot(day, idx, "maxQueue", Number(e.target.value))}
                    className="w-24"
                    placeholder="Max Queue"
                  />
                  <Button
                    size="sm"
                    className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md"
                    onClick={() => deleteSlot(day, idx)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Bottom Spacer */}
      <div className="h-20"></div>
    </form>
  );
}
