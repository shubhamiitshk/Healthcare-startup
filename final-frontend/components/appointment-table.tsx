"use client";

import * as React from "react";
import { Search, Bell, User, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePickerPatients } from "./date-picker-patients";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

type Appointment = {
  id: string;
  queueNo: number;
  patientName: string;
  phoneNumber: string;
  arrivalTime: string;
  age: number;
  status: "waiting" | "serving" | "completed" | "skipped" | "cancelled";
  dateOfEntry: string;
  doctorId: string;
  doctorName: string;
  source: "web" | "mobile";
  patient?: {
    id: string;
    fullName: string;
    phone_number: string;
    gender: string;
    dob: string;
  };
  familyMember?: {
    id: string;
    name: string;
    gender: string;
    dob: string;
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-[#1BBA8D] hover:bg-[#1BBA8D]/80 text-black";
    case "serving":
      return "bg-blue-500 hover:bg-blue-500/80 text-black";
    case "waiting":
      return "bg-orange-500 hover:bg-orange-500/80 text-black";
    case "skipped":
      return "bg-red-500 hover:bg-red-500/80 text-white";
    case "cancelled":
      return "bg-gray-500 hover:bg-gray-500/80 text-white";
    default:
      return "bg-gray-500 hover:bg-gray-500/80 text-black";
  }
};

export function AppointmentTable() {
  const { clinic, isLoading, user } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const itemsPerPage = 5;

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch doctors
  const fetchDoctors = React.useCallback(async () => {
    if (!user || !clinic) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const doctorsList = data.data ?? data;
        setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load doctors", variant: "destructive" });
    }
  }, [user, clinic]);

  // Fetch appointments
  const fetchAppointments = React.useCallback(async () => {
    if (!user || !clinic) return;
    setIsLoadingData(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (date) params.append("date", format(date, "yyyy-MM-dd"));
      if (selectedDoctor !== "all") params.append("doctorId", selectedDoctor);
      const response = await fetch(`${API_URL}/appointments/clinic?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const appointmentsList = data.data ?? data;
        const transformedAppointments: Appointment[] = appointmentsList.map((apt: any) => ({
          id: apt.id,
          queueNo: apt.queue_number || apt.queueNo,
          patientName: apt.patient?.fullName || apt.familyMember?.name || "Unknown",
          phoneNumber: apt.patient?.phone_number || "N/A",
          arrivalTime: apt.schedule?.start_time?.slice(0, 5) || "N/A",
          age: apt.patient?.dob ? calculateAge(apt.patient.dob) : (apt.familyMember?.dob ? calculateAge(apt.familyMember.dob) : 0),
          status: apt.status,
          dateOfEntry: apt.date,
          doctorId: apt.schedule?.doctor?.id || "",
          doctorName: apt.schedule?.doctor?.name || "Unknown",
          source: apt.source || "web",
          patient: apt.patient,
          familyMember: apt.familyMember,
        }));
        setAppointments(transformedAppointments);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load appointments", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [user, clinic, date, selectedDoctor]);

  React.useEffect(() => {
    if (!isLoading && clinic && user) fetchDoctors();
  }, [isLoading, clinic, user, fetchDoctors]);

  React.useEffect(() => {
    if (!isLoading && clinic && user) fetchAppointments();
  }, [isLoading, clinic, user, fetchAppointments]);

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.phoneNumber.includes(searchTerm) ||
      appointment.queueNo.toString().includes(searchTerm);
    return matchesSearch;
  });

  // Map appointments to Patient format for DatePickerPatients component
  const patientsForDatePicker = appointments.map((appointment) => ({
    id: parseInt(appointment.id) || 0,
    queueNo: appointment.queueNo,
    patientName: appointment.patientName,
    phoneNumber: appointment.phoneNumber,
    arrivalTime: appointment.arrivalTime,
    age: appointment.age,
    status: (appointment.status === "waiting" ? "Waiting" : 
            appointment.status === "serving" ? "In Progress" : 
            appointment.status === "completed" ? "Completed" : "Waiting") as "Waiting" | "In Progress" | "Completed",
    dateOfEntry: appointment.dateOfEntry,
    doctorId: appointment.doctorId,
  }));

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(paginatedAppointments.map((apt) => apt.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedRows([...selectedRows, id]);
    else setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
  };

  if (isLoading || !clinic || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164772]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your clinic appointments</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#164772] flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{clinic.name}</div>
              <div className="text-gray-600">Clinic</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search appointments..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerPatients
              appointments={patientsForDatePicker}
            selectedDoctorId={selectedDoctor}
            onDateSelect={setDate}
            />
          </div>
        <div className="text-sm text-gray-600">
            Showing {filteredAppointments.length} appointment(s)
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === paginatedAppointments.length && paginatedAppointments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              <TableHead>Queue No.</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Arrival Time</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoadingData ? (
                <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#164772]"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedAppointments.length > 0 ? (
              paginatedAppointments.map((appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(appointment.id)}
                          onCheckedChange={(checked) => handleSelectRow(appointment.id, checked as boolean)}
                        />
                      </TableCell>
                  <TableCell className="font-medium">{appointment.queueNo}</TableCell>
                  <TableCell>{appointment.patientName}</TableCell>
                  <TableCell>{appointment.phoneNumber}</TableCell>
                  <TableCell>{appointment.arrivalTime}</TableCell>
                  <TableCell>{appointment.age}</TableCell>
                      <TableCell>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                      </TableCell>
                  <TableCell>
                        {format(new Date(appointment.dateOfEntry), "MMM dd, yyyy")}
                      </TableCell>
                  <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>
                    <Badge className={`${
                      appointment.source === "web"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {appointment.source}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-gray-500">
                  No appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
            {selectedRows.length} of {filteredAppointments.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
            <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          <span className="px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}