"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Trash2, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
}

interface DoctorSchedule {
  [key: string]: TimeSlot[]
}

interface Doctor {
  id: string
  name: string
  gender: string
  specialty: string
  email: string
  schedule: DoctorSchedule
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// ====== Prevent overlapping slots ======
function hasOverlap(slots: TimeSlot[]): boolean {
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      return true
    }
  }
  return false
}

export default function ClinicRegistration() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clinicData, setClinicData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    phone: "",
  })

  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: "1",
      name: "",
      gender: "",
      specialty: "",
      email: "",
      schedule: {},
    },
  ])

  const addDoctor = () => {
    const newDoctor: Doctor = {
      id: Date.now().toString(),
      name: "",
      gender: "",
      specialty: "",
      email: "",
      schedule: {},
    }
    setDoctors([...doctors, newDoctor])
  }

  const removeDoctor = (id: string) => {
    if (doctors.length > 1) {
      setDoctors(doctors.filter((doctor) => doctor.id !== id))
    }
  }

  const updateDoctor = (id: string, field: string, value: string) => {
    setDoctors(
      doctors.map((doctor) =>
        doctor.id === id ? { ...doctor, [field]: value } : doctor
      )
    )
  }

  const addTimeSlot = (doctorId: string, day: string) => {
    setDoctors(
      doctors.map((doctor) => {
        if (doctor.id !== doctorId) return doctor

        const existing = doctor.schedule[day] || []
        const newSlot: TimeSlot = {
          id: Date.now().toString(),
          startTime: "", // Set to blank
          endTime: "",   // Set to blank
        }
        const combined = [...existing, newSlot]

        if (hasOverlap(combined)) {
          alert(`❌ Overlapping slot on ${day}. Please choose a different time.`)
          return doctor
        }

        return {
          ...doctor,
          schedule: {
            ...doctor.schedule,
            [day]: combined,
          },
        }
      })
    )
  }

  const removeTimeSlot = (doctorId: string, day: string, slotId: string) => {
    setDoctors(
      doctors.map((doctor) => {
        if (doctor.id === doctorId) {
          return {
            ...doctor,
            schedule: {
              ...doctor.schedule,
              [day]:
                doctor.schedule[day]?.filter((slot) => slot.id !== slotId) ||
                [],
            },
          }
        }
        return doctor
      })
    )
  }

  const updateTimeSlot = (
    doctorId: string,
    day: string,
    slotId: string,
    field: string,
    value: string
  ) => {
    setDoctors(
      doctors.map((doctor) => {
        if (doctor.id !== doctorId) return doctor

        const slots = doctor.schedule[day] || []
        const updatedSlots = slots.map((slot) =>
          slot.id === slotId ? { ...slot, [field]: value } : slot
        )

        if (hasOverlap(updatedSlots)) {
          alert(`❌ Overlapping slot on ${day}. Please adjust times.`)
          return doctor
        }

        return {
          ...doctor,
          schedule: {
            ...doctor.schedule,
            [day]: updatedSlots,
          },
        }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Transform the data to match our backend DTO structure
      const requestData = {
        name: clinicData.name,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        password: clinicData.password,
        doctors: doctors.map((doctor) => ({
          name: doctor.name,
          gender: doctor.gender,
          specialty: doctor.specialty,
          email: doctor.email,
          schedule: Object.entries(doctor.schedule).reduce(
            (acc, [day, slots]) => ({
              ...acc,
              [day.toLowerCase()]: slots.map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            }),
            {}
          ),
        })),
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/clinics/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      setIsRegistered(true)
    } catch (error) {
      console.error("Registration error:", error)
      if (error instanceof Error) {
        alert(error.message || "Registration failed. Please try again.")
      } else {
        alert("Registration failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#f8fafc" }}>
        <Card className="max-w-md w-full text-center p-8 border-2" style={{ borderColor: "#1BBA8B" }}>
          <div className="w-16 h-16 bg-[#1BBA8B]/10 text-[#1BBA8B] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[#164772]">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your clinic <strong>{clinicData.name}</strong> and doctor schedules have been successfully registered.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL ? `${process.env.NEXT_PUBLIC_ADMIN_URL}/login` : "http://localhost:3002/login"}
          >
            <Button className="w-full bg-[#164772] hover:bg-[#123657] text-white py-3 text-lg">
              Proceed to Admin Login
            </Button>
          </a>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "#164772" }}
          >
            Clinic Registration
          </h1>
          <p className="text-gray-600">
            Register your clinic and manage doctor schedules
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Clinic Information */}
          <Card className="border-2" style={{ borderColor: "#1BBA8B" }}>
            <CardHeader style={{ backgroundColor: "#164772" }}>
              <CardTitle className="text-white">Clinic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    value={clinicData.name}
                    onChange={(e) =>
                      setClinicData({ ...clinicData, name: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clinicData.phone}
                    onChange={(e) =>
                      setClinicData({ ...clinicData, phone: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={clinicData.address}
                  onChange={(e) =>
                    setClinicData({ ...clinicData, address: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email ID *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinicData.email}
                    onChange={(e) =>
                      setClinicData({ ...clinicData, email: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This email will be used for clinic login
                  </p>
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={clinicData.password}
                    onChange={(e) =>
                      setClinicData({ ...clinicData, password: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Section */}
          <Card className="border-2" style={{ borderColor: "#1BBA8B" }}>
            <CardHeader
              style={{ backgroundColor: "#164772" }}
              className="flex flex-row items-center justify-between"
            >
              <CardTitle className="text-white">Doctors Information</CardTitle>
              <Button
                type="button"
                onClick={addDoctor}
                variant="secondary"
                size="sm"
                className="bg-white hover:bg-gray-100"
                style={{ color: "#164772" }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {doctors.map((doctor, index) => (
                <div key={doctor.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#164772" }}
                    >
                      Doctor {index + 1}
                    </h3>
                    {doctors.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeDoctor(doctor.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label>Doctor Name *</Label>
                      <Input
                        value={doctor.name}
                        onChange={(e) =>
                          updateDoctor(doctor.id, "name", e.target.value)
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Gender *</Label>
                      <Select
                        value={doctor.gender}
                        onValueChange={(value) =>
                          updateDoctor(doctor.id, "gender", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Specialty *</Label>
                      <Input
                        value={doctor.specialty}
                        onChange={(e) =>
                          updateDoctor(doctor.id, "specialty", e.target.value)
                        }
                        placeholder="Enter specialty"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email ID *</Label>
                      <Input
                        type="email"
                        value={doctor.email}
                        onChange={(e) =>
                          updateDoctor(doctor.id, "email", e.target.value)
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div
                    className="border rounded-lg p-4"
                    style={{ borderColor: "#1BBA8B" }}
                  >
                    <h4
                      className="font-semibold mb-4 flex items-center"
                      style={{ color: "#164772" }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Weekly Schedule
                    </h4>

                    <div className="space-y-4">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="font-medium">{day}</Label>
                            <Button
                              type="button"
                              onClick={() => addTimeSlot(doctor.id, day)}
                              variant="outline"
                              size="sm"
                              style={{ borderColor: "#1BBA8B", color: "#164772" }}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Add Slot
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(doctor.schedule[day] || []).map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center gap-2 p-2 border rounded"
                              >
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      doctor.id,
                                      day,
                                      slot.id,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  className="text-sm"
                                />
                                <span className="text-sm text-gray-500">to</span>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      doctor.id,
                                      day,
                                      slot.id,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  className="text-sm"
                                />
                                <Button
                                  type="button"
                                  onClick={() =>
                                    removeTimeSlot(doctor.id, day, slot.id)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {(!doctor.schedule[day] ||
                            doctor.schedule[day].length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              No slots added for {day}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {index < doctors.length - 1 && (
                    <Separator className="mt-8" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              className="px-12 py-3 text-lg font-semibold text-white"
              style={{ backgroundColor: "#164772" }}
            >
              Register Clinic
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
