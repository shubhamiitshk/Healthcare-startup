"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Menu, MoreHorizontal, Edit, Trash2, Plus, Save, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"

interface TimeSlot {
  id: number
  time: string
  doctor: string
  isBooked: boolean
  patientName?: string
}

const initialTimeSlots: TimeSlot[] = [
  { id: 1, time: "9:00 AM - 11:00 AM", doctor: "Dr. Smith", isBooked: false },
  { id: 2, time: "2:00 PM - 4:00 PM", doctor: "Dr. Smith", isBooked: false },
  { id: 3, time: "6:00 PM - 8:00 PM", doctor: "Dr. Smith", isBooked: false },
  // Example: Dr. Johnson has no slots in this list, etc.
]

interface Patient {
  id: number
  queueNo: number
  name: string
  phone: string
  sex: string
  doctor: string
  slotId: number | null
  status: "serving" | "waiting" | "completed" | "skipped" | "cancelled"
  source: "web" | "mobile"
}

export default function PatientQueue() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("careq_user")
    if (!user) {
      router.push("/login")
    }
  }, [router])

  // ──────────────────────────────────────────────────────────────────────────
  // 1) PATIENT STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      queueNo: 1,
      name: "John Smith",
      phone: "9876543210",
      sex: "Male",
      doctor: "Dr. Johnson",
      slotId: null,
      status: "serving",
      source: "web",
    },
    {
      id: 2,
      queueNo: 2,
      name: "Emily Davis",
      phone: "8765432109",
      sex: "Female",
      doctor: "Dr. Williams",
      slotId: null,
      status: "waiting",
      source: "mobile",
    },
    {
      id: 3,
      queueNo: 3,
      name: "Michael Brown",
      phone: "7654321098",
      sex: "Male",
      doctor: "Dr. Johnson",
      slotId: null,
      status: "waiting",
      source: "web",
    },
    {
      id: 4,
      queueNo: 4,
      name: "Sarah Wilson",
      phone: "6543210987",
      sex: "Female",
      doctor: "Dr. Miller",
      slotId: null,
      status: "completed",
      source: "mobile",
    },
    {
      id: 5,
      queueNo: 5,
      name: "Robert Taylor",
      phone: "5432109876",
      sex: "Male",
      doctor: "Dr. Johnson",
      slotId: null,
      status: "skipped",
      source: "web",
    },
    {
      id: 6,
      queueNo: 6,
      name: "Jennifer Lee",
      phone: "4321098765",
      sex: "Female",
      doctor: "Dr. Williams",
      slotId: null,
      status: "cancelled",
      source: "mobile",
    },
  ])

  const [newPatient, setNewPatient] = useState<{
    name: string
    phone: string
    sex: string
    dob: string
    doctor: string
    slotId: number | null
    source: "web" | "mobile"
  }>({
    name: "",
    phone: "",
    sex: "",
    dob: "",
    doctor: "",
    slotId: null,
    source: "web",
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2) DOCTOR + SLOT SELECTION (MAIN QUEUE)
  // ──────────────────────────────────────────────────────────────────────────
  const firstSmithSlot = initialTimeSlots.find((s) => s.doctor === "Dr. Smith")
  const [selectedDoctor, setSelectedDoctor] = useState<string>("Dr. Smith")
  const [selectedSlot, setSelectedSlot] = useState<number | null>(firstSmithSlot ? firstSmithSlot.id : null)

  // ──────────────────────────────────────────────────────────────────────────
  // 3) TIME SLOTS STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [editingStartTime, setEditingStartTime] = useState("")
  const [editingEndTime, setEditingEndTime] = useState("")
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlotStartTime, setNewSlotStartTime] = useState("")
  const [newSlotEndTime, setNewSlotEndTime] = useState("")
  const [selectedScheduleDoctor, setSelectedScheduleDoctor] = useState("Dr. Smith")

  const [bookingSettings, setBookingSettings] = useState({
    onlineBookingEnabled: true,
    bookingStart: "08:00",
    bookingEnd: "17:00",
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4) FILTER + EXPANDER STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [expandedSections, setExpandedSections] = useState({
    serving: true,
    waiting: true,
    completed: true,
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5) EMERGENCY + TOAST STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [emergencyMessage, setEmergencyMessage] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)

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
  ]

  // ──────────────────────────────────────────────────────────────────────────
  // 7) EFFECT: WHEN selectedDoctor CHANGES, PICK FIRST SLOT OR NULL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const slotsForDoctor = timeSlots.filter((slot) => slot.doctor === selectedDoctor)
    if (slotsForDoctor.length > 0) {
      setSelectedSlot(slotsForDoctor[0].id)
    } else {
      setSelectedSlot(null)
    }
  }, [selectedDoctor, timeSlots])

  // ──────────────────────────────────────────────────────────────────────────
  // 8) EFFECT: WHEN newPatient.doctor CHANGES, PRESELECT FORM’S SLOT OR NULL
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const slotsForNew = timeSlots.filter((slot) => slot.doctor === newPatient.doctor)
    if (slotsForNew.length > 0) {
      setNewPatient((prev) => ({ ...prev, slotId: slotsForNew[0].id }))
    } else {
      setNewPatient((prev) => ({ ...prev, slotId: null }))
    }
  }, [newPatient.doctor, timeSlots])

  // ──────────────────────────────────────────────────────────────────────────
  // 9) HELPER: GET TODAY’S SLOTS FOR A GIVEN DOCTOR
  // ──────────────────────────────────────────────────────────────────────────
  const getTodaySlots = (doctor: string) => {
    return timeSlots.filter((slot) => slot.doctor === doctor)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10) ADD A PATIENT TO QUEUE (PREVENT IF DOCTOR HAS NO SLOTS)
  // ──────────────────────────────────────────────────────────────────────────
  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.doctor || !newPatient.phone) {
      return
    }

    // If the chosen doctor has ZERO slots, do not allow adding:
    const doctorSlots = getTodaySlots(newPatient.doctor)
    if (doctorSlots.length === 0) {
      toast({
        title: "Cannot Add Patient",
        description: `${newPatient.doctor} has no available slots.`,
        variant: "destructive",
      })
      return
    }

    // Otherwise proceed to add:
    const newId = patients.length > 0 ? Math.max(...patients.map((p) => p.id)) + 1 : 1
    setPatients([
      ...patients,
      {
        id: newId,
        queueNo: newId,
        name: newPatient.name,
        phone: newPatient.phone,
        sex: newPatient.sex,
        doctor: newPatient.doctor,
        slotId: newPatient.slotId,
        status: "waiting",
        source: newPatient.source,
      },
    ])
    setNewPatient({
      name: "",
      phone: "",
      sex: "",
      dob: "",
      doctor: "",
      slotId: null,
      source: "web",
    })
    toast({
      title: "Patient Added",
      description: `${newPatient.name} has been added to the queue.`,
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11) CHANGE A PATIENT’S STATUS
  // ──────────────────────────────────────────────────────────────────────────
  const handleStatusChange = (id: number, status: "serving" | "waiting" | "completed" | "skipped" | "cancelled") => {
    setPatients(
      patients.map((patient) => {
        if (patient.id === id) {
          toast({
            title: "Status Updated",
            description: `${patient.name}'s status changed to ${status}.`,
          })
          return { ...patient, status }
        }
        return patient
      }),
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12) TOGGLE COLLAPSIBLE SECTIONS
  // ──────────────────────────────────────────────────────────────────────────
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13) PARSE A TIME RANGE STRING
  // ──────────────────────────────────────────────────────────────────────────
  const parseTimeSlot = (timeSlot: string) => {
    const parts = timeSlot.split(" - ")
    return {
      start: parts[0] || "",
      end: parts[1] || "",
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14) SLOT EDIT / SAVE / DELETE / ADD (UNCHANGED)
  // ──────────────────────────────────────────────────────────────────────────
  const handleEditSlot = (slotId: number, currentTime: string) => {
    const { start, end } = parseTimeSlot(currentTime)
    setEditingSlot(slotId)
    setEditingStartTime(start)
    setEditingEndTime(end)
  }

  const handleSaveSlot = (slotId: number) => {
    if (editingStartTime && editingEndTime) {
      const newTime = `${editingStartTime} - ${editingEndTime}`
      setTimeSlots(timeSlots.map((slot) => (slot.id === slotId ? { ...slot, time: newTime } : slot)))
      setEditingSlot(null)
      setEditingStartTime("")
      setEditingEndTime("")
      toast({
        title: "Time Slot Updated",
        description: "Time slot has been updated successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingSlot(null)
    setEditingStartTime("")
    setEditingEndTime("")
  }

  const handleDeleteSlot = (slotId: number) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== slotId))
    toast({
      title: "Time Slot Deleted",
      description: "Time slot has been deleted successfully.",
    })
  }

  const handleAddSlot = () => {
    if (newSlotStartTime && newSlotEndTime) {
      const newTime = `${newSlotStartTime} - ${newSlotEndTime}`
      const newId = Math.max(...timeSlots.map((slot) => slot.id)) + 1
      setTimeSlots([
        ...timeSlots,
        {
          id: newId,
          time: newTime,
          doctor: selectedScheduleDoctor,
          isBooked: false,
        },
      ])
      setNewSlotStartTime("")
      setNewSlotEndTime("")
      setShowAddSlot(false)
      toast({
        title: "Time Slot Added",
        description: "New time slot has been added successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      })
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 15) FILTER PATIENTS BY STATUS, DOCTOR & SELECTED SLOT ONLY
  //     If selectedSlot is null, return an empty array (no patients shown).
  // ──────────────────────────────────────────────────────────────────────────
  const filteredPatients = (status: string) => {
    // If no slot is selected (or doctor has zero slots), return empty so no rows appear:
    if (selectedSlot === null) {
      return []
    }

    let filtered = patients
    // a) filter by status
    if (filterStatus === "all") {
      filtered = filtered.filter((p) => p.status === status)
    } else {
      filtered = filtered.filter((p) => p.status === filterStatus)
    }
    // b) filter by doctor
    filtered = filtered.filter((p) => p.doctor === selectedDoctor)
    // c) filter by slot
    filtered = filtered.filter((p) => p.slotId === selectedSlot)

    return filtered
  }

  const servingPatients = filteredPatients("serving")
  const waitingPatients = filteredPatients("waiting")
  const completedPatients = filteredPatients("completed")
  const skippedPatients = filteredPatients("skipped")
  const cancelledPatients = filteredPatients("cancelled")

  return (
    <div className="flex min-h-screen bg-white">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#164772] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#1BBA8D] rounded-full"></div>
            </div>
            <span className="text-white text-xl font-semibold">CareQ</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="w-5 h-5 border border-current rounded"></div>
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-white bg-white/10 rounded-lg">
              <div className="w-5 h-5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                </svg>
              </div>
              <span>My Queue</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="w-5 h-5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Doctors</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="w-5 h-5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Appointments</span>
              <div className="ml-auto">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="w-5 h-5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Settings</span>
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
            <div className="w-5 h-5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex">
        {/* LEFT PANEL */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-[#164772]">My Queue</h1>
            <div className="flex items-center gap-4">
              {/* Doctor Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Doctor:</span>
                <Select value={selectedDoctor} onValueChange={(val) => setSelectedDoctor(val)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                    <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                    <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
                    <SelectItem value="Dr. Miller">Dr. Miller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Slot Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Slot:</span>
                <Select
                  value={selectedSlot !== null ? selectedSlot.toString() : ""}
                  onValueChange={(val) => setSelectedSlot(Number(val))}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTodaySlots(selectedDoctor).map((slot) => (
                      <SelectItem key={slot.id} value={slot.id.toString()}>
                        {slot.time}
                      </SelectItem>
                    ))}
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
              onClick={() => setFilterStatus(filterStatus === "skipped" ? "all" : "skipped")}
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
              onClick={() => setFilterStatus(filterStatus === "cancelled" ? "all" : "cancelled")}
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
                {expandedSections.serving ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span className="font-medium ml-2">Serving now</span>
                <span className="ml-2 bg-white text-[#1BBA8D] w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {servingPatients.length}
                </span>
              </div>
              {expandedSections.serving && servingPatients.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">Queue No.</th>
                          <th className="text-left p-4 font-medium text-gray-600">Patient Name</th>
                          <th className="text-left p-4 font-medium text-gray-600">Phone Number</th>
                          <th className="text-left p-4 font-medium text-gray-600">Sex</th>
                          <th className="text-left p-4 font-medium text-gray-600">Source</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servingPatients.map((patient) => (
                          <tr key={patient.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{patient.queueNo}</td>
                            <td className="p-4">{patient.name}</td>
                            <td className="p-4">{patient.phone}</td>
                            <td className="p-4">{patient.sex}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patient.source === "web" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {patient.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    {patient.status === "waiting" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "serving")}>
                                        Call Next
                                      </DropdownMenuItem>
                                    )}
                                    {patient.status === "serving" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "completed")}>
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "skipped")}>
                                      Skip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "cancelled")}>
                                      Cancel
                                    </DropdownMenuItem>
                                    {(patient.status === "skipped" ||
                                      patient.status === "cancelled" ||
                                      patient.status === "completed") && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "waiting")}>
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

          {/* WAITING */}
          {filterStatus === "all" && (
            <div className="mb-4">
              <div
                className="flex items-center bg-[#FFF3E0] text-[#F59E0B] p-3 rounded-t-md cursor-pointer"
                onClick={() => toggleSection("waiting")}
              >
                {expandedSections.waiting ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span className="font-medium ml-2">Waiting</span>
                <span className="ml-2 bg-white text-[#F59E0B] w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {waitingPatients.length}
                </span>
              </div>
              {expandedSections.waiting && waitingPatients.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">Queue No.</th>
                          <th className="text-left p-4 font-medium text-gray-600">Patient Name</th>
                          <th className="text-left p-4 font-medium text-gray-600">Phone Number</th>
                          <th className="text-left p-4 font-medium text-gray-600">Sex</th>
                          <th className="text-left p-4 font-medium text-gray-600">Source</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitingPatients.map((patient) => (
                          <tr key={patient.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{patient.queueNo}</td>
                            <td className="p-4">{patient.name}</td>
                            <td className="p-4">{patient.phone}</td>
                            <td className="p-4">{patient.sex}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patient.source === "web" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {patient.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    {patient.status === "waiting" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "serving")}>
                                        Call Next
                                      </DropdownMenuItem>
                                    )}
                                    {patient.status === "serving" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "completed")}>
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "skipped")}>
                                      Skip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "cancelled")}>
                                      Cancel
                                    </DropdownMenuItem>
                                    {(patient.status === "skipped" ||
                                      patient.status === "cancelled" ||
                                      patient.status === "completed") && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "waiting")}>
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
          {filterStatus === "all" && completedPatients.length > 0 && (
            <div className="mb-4">
              <div
                className="flex items-center bg-gray-200 text-gray-600 p-3 rounded-t-md cursor-pointer"
                onClick={() => toggleSection("completed")}
              >
                {expandedSections.completed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                <span className="font-medium ml-2">Completed</span>
                <span className="ml-2 bg-white text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {completedPatients.length}
                </span>
              </div>
              {expandedSections.completed && (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium text-gray-600">Queue No.</th>
                          <th className="text-left p-4 font-medium text-gray-600">Patient Name</th>
                          <th className="text-left p-4 font-medium text-gray-600">Phone Number</th>
                          <th className="text-left p-4 font-medium text-gray-600">Sex</th>
                          <th className="text-left p-4 font-medium text-gray-600">Source</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedPatients.map((patient) => (
                          <tr key={patient.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{patient.queueNo}</td>
                            <td className="p-4">{patient.name}</td>
                            <td className="p-4">{patient.phone}</td>
                            <td className="p-4">{patient.sex}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  patient.source === "web" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {patient.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    {patient.status === "waiting" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "serving")}>
                                        Call Next
                                      </DropdownMenuItem>
                                    )}
                                    {patient.status === "serving" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "completed")}>
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "skipped")}>
                                      Skip
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "cancelled")}>
                                      Cancel
                                    </DropdownMenuItem>
                                    {(patient.status === "skipped" ||
                                      patient.status === "cancelled" ||
                                      patient.status === "completed") && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "waiting")}>
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
          {filterStatus === "skipped" && skippedPatients.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center bg-red-100 text-red-600 p-3 rounded-t-md">
                <span className="font-medium ml-2">Skipped</span>
                <span className="ml-2 bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {skippedPatients.length}
                </span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-600">Queue No.</th>
                        <th className="text-left p-4 font-medium text-gray-600">Patient Name</th>
                        <th className="text-left p-4 font-medium text-gray-600">Phone Number</th>
                        <th className="text-left p-4 font-medium text-gray-600">Sex</th>
                        <th className="text-left p-4 font-medium text-gray-600">Doctor</th>
                        <th className="text-left p-4 font-medium text-gray-600">Source</th>
                        <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedPatients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{patient.queueNo}</td>
                          <td className="p-4">{patient.name}</td>
                          <td className="p-4">{patient.phone}</td>
                          <td className="p-4">{patient.sex}</td>
                          <td className="p-4">{patient.doctor}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.source === "web" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {patient.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-50">
                                  {patient.status === "waiting" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "serving")}>
                                      Call Next
                                    </DropdownMenuItem>
                                  )}
                                  {patient.status === "serving" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "completed")}>
                                      Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "skipped")}>
                                    Skip
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "cancelled")}>
                                    Cancel
                                  </DropdownMenuItem>
                                  {(patient.status === "skipped" ||
                                    patient.status === "cancelled" ||
                                    patient.status === "completed") && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "waiting")}>
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
          {filterStatus === "cancelled" && cancelledPatients.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center bg-gray-300 text-gray-700 p-3 rounded-t-md">
                <span className="font-medium ml-2">Cancelled</span>
                <span className="ml-2 bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {cancelledPatients.length}
                </span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-600">Queue No.</th>
                        <th className="text-left p-4 font-medium text-gray-600">Patient Name</th>
                        <th className="text-left p-4 font-medium text-gray-600">Phone Number</th>
                        <th className="text-left p-4 font-medium text-gray-600">Sex</th>
                        <th className="text-left p-4 font-medium text-gray-600">Doctor</th>
                        <th className="text-left p-4 font-medium text-gray-600">Source</th>
                        <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledPatients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{patient.queueNo}</td>
                          <td className="p-4">{patient.name}</td>
                          <td className="p-4">{patient.phone}</td>
                          <td className="p-4">{patient.sex}</td>
                          <td className="p-4">{patient.doctor}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                patient.source === "web" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {patient.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-50">
                                  {patient.status === "waiting" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "serving")}>
                                      Call Next
                                    </DropdownMenuItem>
                                  )}
                                  {patient.status === "serving" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "completed")}>
                                      Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "skipped")}>
                                    Skip
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "cancelled")}>
                                    Cancel
                                  </DropdownMenuItem>
                                  {(patient.status === "skipped" ||
                                    patient.status === "cancelled" ||
                                    patient.status === "completed") && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(patient.id, "waiting")}>
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
          {/* BOTTOM ACTION BUTTONS */}
          <div className="sticky bottom-0 left-0 right-0 bg-white py-4 border-t mt-4 z-10 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const servingPatient = patients.find((p) => p.status === "serving")
                if (servingPatient) {
                  handleStatusChange(servingPatient.id, "completed")
                  toast({
                    title: "Consultation Finished",
                    description: `${servingPatient.name}'s consultation has been completed.`,
                  })
                } else {
                  toast({
                    title: "No Active Patient",
                    description: "There is no patient currently being served.",
                    variant: "destructive",
                  })
                }
              }}
            >
              Finish Consultation
            </Button>

            <Button
              variant="outline"
              className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700"
              onClick={() => {
                const servingPatient = patients.find((p) => p.status === "serving")
                if (servingPatient) {
                  handleStatusChange(servingPatient.id, "skipped")
                  toast({
                    title: "Patient Skipped",
                    description: `${servingPatient.name} has been skipped.`,
                  })
                } else {
                  toast({
                    title: "No Active Patient",
                    description: "There is no patient currently being served.",
                    variant: "destructive",
                  })
                }
              }}
            >
              Skip Patient
            </Button>

            <Button
              className="bg-[#1BBA8D] hover:bg-[#16A67D]"
              onClick={() => {
                const waitingPatient = patients.find((p) => p.status === "waiting")
                if (waitingPatient) {
                  handleStatusChange(waitingPatient.id, "serving")
                  toast({
                    title: "Patient Called",
                    description: `${waitingPatient.name} has been called for consultation.`,
                  })
                } else {
                  toast({
                    title: "No Waiting Patients",
                    description: "There are no patients waiting in the queue.",
                    variant: "destructive",
                  })
                }
              }}
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
              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Doctor&apos;s Schedule</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Doctor Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Doctor :</label>
                    <Select value={selectedScheduleDoctor} onValueChange={setSelectedScheduleDoctor}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                        <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                        <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
                        <SelectItem value="Dr. Miller">Dr. Miller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Today's Availability */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Today&apos;s Availability :</h3>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowAddSlot(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {getTodaySlots(selectedScheduleDoctor).map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                        >
                          {editingSlot === slot.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-2 flex-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <Select value={editingStartTime} onValueChange={setEditingStartTime}>
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
                                <Select value={editingEndTime} onValueChange={setEditingEndTime}>
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
                                <span className="text-sm">{slot.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditSlot(slot.id, slot.time)}
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
                          <Select value={newSlotStartTime} onValueChange={setNewSlotStartTime}>
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
                          <Select value={newSlotEndTime} onValueChange={setNewSlotEndTime}>
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
                              setShowAddSlot(false)
                              setNewSlotStartTime("")
                              setNewSlotEndTime("")
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
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Other Day&apos;s Availability :</h3>
                    <div className="space-y-3">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                        <Select key={day}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={day} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9am-5pm">9:00 AM - 5:00 PM</SelectItem>
                            <SelectItem value="10am-6pm">10:00 AM - 6:00 PM</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Booking Settings</h3>
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
                        <Label htmlFor="booking-time" className="text-sm text-gray-600 block mb-2">
                          Booking Opening Time
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input id="booking-time" value="9:00 AM" readOnly className="flex-1" />
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
              <label className="text-sm text-gray-600 block mb-1">Mobile Number</label>
              <div className="flex items-center gap-2">
              <Input
  placeholder="Mobile Number"
  value={newPatient.phone}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
    setNewPatient({ ...newPatient, phone: e.target.value })
  }
/>

                <Button
                  variant="outline"
                  className="bg-white text-[#1BBA8D] border border-[#1BBA8D] hover:bg-[#f0fdfb]"
                  onClick={() => {
                    if (/^\d{10}$/.test(newPatient.phone)) {
                      toast({
                        title: "Number Verified",
                        description: "Mobile number is valid.",
                      })
                    } else {
                      toast({
                        title: "Invalid Number",
                        description: "Please enter a valid 10-digit mobile number.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Verify
                </Button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Name</label>
              <Input
                placeholder="Name"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              />
            </div>

            {/* Sex + DOB */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Sex</label>
                <Select value={newPatient.sex} onValueChange={(val) => setNewPatient({ ...newPatient, sex: val })}>
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
                  onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                  className="h-9 px-1 text-sm appearance-auto"
                  style={{
                    paddingRight: "0.75rem", // make space for calendar icon
                  }}
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Doctor Selection</label>
              <Select value={newPatient.doctor} onValueChange={(val) => setNewPatient({ ...newPatient, doctor: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                  <SelectItem value="Dr. Johnson">Dr. Johnson</SelectItem>
                  <SelectItem value="Dr. Williams">Dr. Williams</SelectItem>
                  <SelectItem value="Dr. Miller">Dr. Miller</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Slot Selection (only if that doctor has slots) */}
            {newPatient.doctor && getTodaySlots(newPatient.doctor).length > 0 && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">Slot Selection</label>
                <Select
                  value={newPatient.slotId !== null ? newPatient.slotId.toString() : ""}
                  onValueChange={(val) => setNewPatient({ ...newPatient, slotId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTodaySlots(newPatient.doctor).map((slot) => (
                      <SelectItem key={slot.id} value={slot.id.toString()}>
                        {slot.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full bg-[#1BBA8D] hover:bg-[#16A67D]" onClick={handleAddPatient}>
              Add in Queue
            </Button>
          </div>

          {/* EMERGENCY MESSAGE SECTION */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-[#164772]">Emergency Status</h3>
              <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
            </div>

            {isEmergency && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Emergency Message</label>
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
                        description: "Message has been sent to all waiting patients.",
                      })
                    } else {
                      setEmergencyMessage("Doctor is currently unavailable due to emergency.")
                    }
                  }}
                >
                  Send to Patients
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
