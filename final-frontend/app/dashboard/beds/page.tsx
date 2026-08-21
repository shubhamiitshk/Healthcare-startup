"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bed,
  BedDouble,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  Trash2,
  Edit,
  UserMinus,
  Wrench,
  Sparkles,
} from "lucide-react"
import Layout from "@/components/layout"
import { useAuth } from "@/components/auth-provider"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

interface Ward {
  id: string
  name: string
  ward_type: string
  capacity: number
  floor: number
  is_active: boolean
  beds: Bed[]
}

interface Bed {
  id: string
  bed_number: string
  bed_type: string
  status: string
  has_ventilator: boolean
  has_cardiac_monitor: boolean
  has_oxygen: boolean
  is_isolation: boolean
  daily_rate: number
  ward?: Ward
  allocations?: Allocation[]
  equipment?: Equipment[]
}

interface Allocation {
  id: string
  patient_id: string
  admitted_at: string
  expected_discharge: string
  status: string
  patient?: { id: string; full_name: string; phone_number: string }
}

interface Equipment {
  id: string
  equipment_type: string
  serial_number: string
  status: string
}

interface BedStats {
  total: number
  available: number
  occupied: number
  reserved: number
  maintenance: number
  cleaning: number
  urgent: number
  occupancy_rate: number
  wardBreakdown: {
    ward_id: string
    ward_name: string
    ward_type: string
    capacity: number
    total_beds: number
    available: number
    occupied: number
    reserved: number
    maintenance: number
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  occupied: "bg-red-100 text-red-800 border-red-200",
  reserved: "bg-amber-100 text-amber-800 border-amber-200",
  maintenance: "bg-gray-100 text-gray-800 border-gray-200",
  cleaning: "bg-blue-100 text-blue-800 border-blue-200",
}

const STATUS_DOT: Record<string, string> = {
  available: "bg-emerald-500",
  occupied: "bg-red-500",
  reserved: "bg-amber-500",
  maintenance: "bg-gray-500",
  cleaning: "bg-blue-500",
}

export default function BedsPage() {
  const { clinic, user } = useAuth()
  const [stats, setStats] = useState<BedStats | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedWard, setSelectedWard] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddWard, setShowAddWard] = useState(false)
  const [showAddBed, setShowAddBed] = useState(false)
  const [showAllocate, setShowAllocate] = useState<string | null>(null)
  const [showDischarge, setShowDischarge] = useState<string | null>(null)

  // Form states
  const [wardForm, setWardForm] = useState({ name: "", ward_type: "general", capacity: 10, floor: 1 })
  const [bedForm, setBedForm] = useState({ bed_number: "", bed_type: "standard", daily_rate: 0 })
  const [allocateForm, setAllocateForm] = useState({ patient_id: "", expected_discharge: "" })

  useEffect(() => {
    if (!clinic || !user) return
    fetchData()
  }, [clinic, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = await user?.getIdToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, wardsRes] = await Promise.all([
        fetch(`${API_URL}/beds/stats/dashboard`, { headers }),
        fetch(`${API_URL}/beds/wards`, { headers }),
      ])

      const statsData = await statsRes.json()
      const wardsData = await wardsRes.json()

      setStats(statsData)
      setWards(wardsData)
    } catch (err) {
      console.error("Failed to fetch bed data:", err)
    } finally {
      setLoading(false)
    }
  }

  const createWard = async () => {
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds/wards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(wardForm),
      })
      setShowAddWard(false)
      setWardForm({ name: "", ward_type: "general", capacity: 10, floor: 1 })
      fetchData()
    } catch (err) {
      console.error("Failed to create ward:", err)
    }
  }

  const createBed = async () => {
    if (!selectedWard) return
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...bedForm, ward_id: selectedWard }),
      })
      setShowAddBed(false)
      setBedForm({ bed_number: "", bed_type: "standard", daily_rate: 0 })
      fetchData()
    } catch (err) {
      console.error("Failed to create bed:", err)
    }
  }

  const allocateBed = async (bedId: string) => {
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bed_id: bedId, ...allocateForm }),
      })
      setShowAllocate(null)
      setAllocateForm({ patient_id: "", expected_discharge: "" })
      fetchData()
    } catch (err) {
      console.error("Failed to allocate bed:", err)
    }
  }

  const dischargeBed = async (allocationId: string) => {
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds/allocate/${allocationId}/discharge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ discharge_notes: "Discharged from dashboard" }),
      })
      setShowDischarge(null)
      fetchData()
    } catch (err) {
      console.error("Failed to discharge bed:", err)
    }
  }

  const updateBedStatus = async (bedId: string, status: string) => {
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds/${bedId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (err) {
      console.error("Failed to update bed status:", err)
    }
  }

  const deleteBed = async (bedId: string) => {
    if (!confirm("Are you sure you want to delete this bed?")) return
    try {
      const token = await user?.getIdToken()
      await fetch(`${API_URL}/beds/${bedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (err) {
      console.error("Failed to delete bed:", err)
    }
  }

  const filteredBeds = selectedWard
    ? wards.find((w) => w.id === selectedWard)?.beds ?? []
    : wards.flatMap((w) => w.beds ?? [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Bed Management</h1>
            <p className="text-sm text-gray-500">Real-time bed tracking and allocation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddWard(true)} className="bg-[#1BBA8D] hover:bg-[#16a07a]">
              <Plus className="h-4 w-4 mr-2" /> Add Ward
            </Button>
            {selectedWard && (
              <Button onClick={() => setShowAddBed(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Bed
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BedDouble className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total Beds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
                    <p className="text-xs text-gray-500">Occupied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats.reserved}</p>
                    <p className="text-xs text-gray-500">Reserved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{stats.maintenance}</p>
                    <p className="text-xs text-gray-500">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.cleaning}</p>
                    <p className="text-xs text-gray-500">Cleaning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.occupancy_rate}%</p>
                    <p className="text-xs text-gray-500">Occupancy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Ward List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Wards</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <button
                onClick={() => setSelectedWard(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  !selectedWard ? "bg-[#1BBA8D] text-white" : "hover:bg-gray-100"
                }`}
              >
                All Wards
              </button>
              {wards.map((ward) => (
                <button
                  key={ward.id}
                  onClick={() => setSelectedWard(ward.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedWard === ward.id ? "bg-[#1BBA8D] text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{ward.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {ward.beds?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-70">Floor {ward.floor}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Bed Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {selectedWard
                    ? wards.find((w) => w.id === selectedWard)?.name ?? "Ward"
                    : "All Beds"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BBA8D]" />
                  </div>
                ) : filteredBeds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bed className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No beds found. Add a ward and beds to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredBeds.map((bed) => (
                      <div
                        key={bed.id}
                        className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                          bed.status === "available"
                            ? "border-emerald-200 bg-emerald-50"
                            : bed.status === "occupied"
                            ? "border-red-200 bg-red-50"
                            : bed.status === "reserved"
                            ? "border-amber-200 bg-amber-50"
                            : bed.status === "maintenance"
                            ? "border-gray-200 bg-gray-50"
                            : "border-blue-200 bg-blue-50"
                        }`}
                      >
                        {/* Status dot */}
                        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${STATUS_DOT[bed.status]}`} />

                        {/* Bed number */}
                        <p className="font-bold text-lg">{bed.bed_number}</p>
                        <p className="text-xs text-gray-500 capitalize">{bed.bed_type}</p>

                        {/* Equipment icons */}
                        <div className="flex gap-1 mt-2">
                          {bed.has_ventilator && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">V</span>
                          )}
                          {bed.has_cardiac_monitor && (
                            <span className="text-xs bg-pink-100 text-pink-700 px-1 rounded">C</span>
                          )}
                          {bed.has_oxygen && (
                            <span className="text-xs bg-cyan-100 text-cyan-700 px-1 rounded">O</span>
                          )}
                          {bed.is_isolation && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">I</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 mt-2">
                          {bed.status === "available" && (
                            <Button
                              size="sm"
                              className="h-6 text-xs bg-[#1BBA8D]"
                              onClick={() => setShowAllocate(bed.id)}
                            >
                              Allocate
                            </Button>
                          )}
                          {bed.status === "occupied" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-xs"
                              onClick={() => {
                                const alloc = bed.allocations?.find((a) => a.status === "active")
                                if (alloc) setShowDischarge(alloc.id)
                              }}
                            >
                              Discharge
                            </Button>
                          )}
                          {bed.status === "cleaning" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => updateBedStatus(bed.id, "available")}
                            >
                              Mark Clean
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => deleteBed(bed.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Ward Modal */}
        {showAddWard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Ward</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ward Name</label>
                  <input
                    type="text"
                    value={wardForm.name}
                    onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="e.g., ICU, General Ward A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={wardForm.ward_type}
                      onChange={(e) => setWardForm({ ...wardForm, ward_type: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="general">General</option>
                      <option value="icu">ICU</option>
                      <option value="emergency">Emergency</option>
                      <option value="maternity">Maternity</option>
                      <option value="pediatric">Pediatric</option>
                      <option value="surgical">Surgical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    <input
                      type="number"
                      value={wardForm.capacity}
                      onChange={(e) => setWardForm({ ...wardForm, capacity: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Floor</label>
                  <input
                    type="number"
                    value={wardForm.floor}
                    onChange={(e) => setWardForm({ ...wardForm, floor: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    min={0}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddWard(false)}>Cancel</Button>
                  <Button className="bg-[#1BBA8D]" onClick={createWard}>Create Ward</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Bed Modal */}
        {showAddBed && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Bed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Bed Number</label>
                    <input
                      type="text"
                      value={bedForm.bed_number}
                      onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      placeholder="e.g., A001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={bedForm.bed_type}
                      onChange={(e) => setBedForm({ ...bedForm, bed_type: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="standard">Standard</option>
                      <option value="icu">ICU</option>
                      <option value="emergency">Emergency</option>
                      <option value="surgical">Surgical</option>
                      <option value="maternity">Maternity</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Daily Rate (Rs.)</label>
                  <input
                    type="number"
                    value={bedForm.daily_rate}
                    onChange={(e) => setBedForm({ ...bedForm, daily_rate: parseFloat(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    min={0}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddBed(false)}>Cancel</Button>
                  <Button className="bg-[#1BBA8D]" onClick={createBed}>Add Bed</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Allocate Bed Modal */}
        {showAllocate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Allocate Bed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <input
                    type="text"
                    value={allocateForm.patient_id}
                    onChange={(e) => setAllocateForm({ ...allocateForm, patient_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Patient phone or ID"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Discharge</label>
                  <input
                    type="datetime-local"
                    value={allocateForm.expected_discharge}
                    onChange={(e) => setAllocateForm({ ...allocateForm, expected_discharge: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAllocate(null)}>Cancel</Button>
                  <Button className="bg-[#1BBA8D]" onClick={() => allocateBed(showAllocate)}>Allocate</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discharge Modal */}
        {showDischarge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Discharge Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Are you sure you want to discharge this patient?</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDischarge(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => dischargeBed(showDischarge)}>Discharge</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
