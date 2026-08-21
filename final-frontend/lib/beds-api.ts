import { Ward, Bed, BedAllocation, BedStats, CreateWardDto, CreateBedDto, AllocateBedDto, DischargeBedDto } from "@/types/beds"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

async function authHeaders(user: any) {
  const token = await user?.getIdToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

// ─── WARD API ──────────────────────────────────────────────────────────────

export async function fetchWards(user: any): Promise<Ward[]> {
  const res = await fetch(`${API_URL}/beds/wards`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch wards")
  return res.json()
}

export async function fetchWard(user: any, wardId: string): Promise<Ward> {
  const res = await fetch(`${API_URL}/beds/wards/${wardId}`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch ward")
  return res.json()
}

export async function createWard(user: any, dto: CreateWardDto): Promise<Ward> {
  const res = await fetch(`${API_URL}/beds/wards`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to create ward")
  return res.json()
}

export async function updateWard(user: any, wardId: string, dto: Partial<CreateWardDto>): Promise<Ward> {
  const res = await fetch(`${API_URL}/beds/wards/${wardId}`, {
    method: "PATCH",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to update ward")
  return res.json()
}

export async function deleteWard(user: any, wardId: string): Promise<void> {
  const res = await fetch(`${API_URL}/beds/wards/${wardId}`, {
    method: "DELETE",
    headers: await authHeaders(user),
  })
  if (!res.ok) throw new Error("Failed to delete ward")
}

// ─── BED API ───────────────────────────────────────────────────────────────

export async function fetchBeds(user: any, wardId?: string): Promise<Bed[]> {
  const url = wardId ? `${API_URL}/beds?ward_id=${wardId}` : `${API_URL}/beds`
  const res = await fetch(url, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch beds")
  return res.json()
}

export async function fetchBed(user: any, bedId: string): Promise<Bed> {
  const res = await fetch(`${API_URL}/beds/${bedId}`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch bed")
  return res.json()
}

export async function createBed(user: any, dto: CreateBedDto): Promise<Bed> {
  const res = await fetch(`${API_URL}/beds`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to create bed")
  return res.json()
}

export async function updateBed(user: any, bedId: string, dto: Partial<CreateBedDto>): Promise<Bed> {
  const res = await fetch(`${API_URL}/beds/${bedId}`, {
    method: "PATCH",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to update bed")
  return res.json()
}

export async function updateBedStatus(user: any, bedId: string, status: string): Promise<Bed> {
  const res = await fetch(`${API_URL}/beds/${bedId}/status`, {
    method: "PATCH",
    headers: await authHeaders(user),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error("Failed to update bed status")
  return res.json()
}

export async function deleteBed(user: any, bedId: string): Promise<void> {
  const res = await fetch(`${API_URL}/beds/${bedId}`, {
    method: "DELETE",
    headers: await authHeaders(user),
  })
  if (!res.ok) throw new Error("Failed to delete bed")
}

// ─── ALLOCATION API ────────────────────────────────────────────────────────

export async function allocateBed(user: any, dto: AllocateBedDto): Promise<BedAllocation> {
  const res = await fetch(`${API_URL}/beds/allocate`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to allocate bed")
  return res.json()
}

export async function dischargeBed(user: any, allocationId: string, dto?: DischargeBedDto): Promise<BedAllocation> {
  const res = await fetch(`${API_URL}/beds/allocate/${allocationId}/discharge`, {
    method: "PATCH",
    headers: await authHeaders(user),
    body: JSON.stringify(dto ?? {}),
  })
  if (!res.ok) throw new Error("Failed to discharge bed")
  return res.json()
}

export async function fetchActiveAllocations(user: any): Promise<BedAllocation[]> {
  const res = await fetch(`${API_URL}/beds/allocations/active`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch allocations")
  return res.json()
}

export async function fetchAllocationHistory(user: any): Promise<BedAllocation[]> {
  const res = await fetch(`${API_URL}/beds/allocations/history`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch allocation history")
  return res.json()
}

// ─── STATS API ─────────────────────────────────────────────────────────────

export async function fetchBedStats(user: any): Promise<BedStats> {
  const res = await fetch(`${API_URL}/beds/stats/dashboard`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch bed stats")
  return res.json()
}

// ─── EQUIPMENT API ─────────────────────────────────────────────────────────

export async function addEquipment(user: any, bedId: string, dto: any): Promise<any> {
  const res = await fetch(`${API_URL}/beds/${bedId}/equipment`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error("Failed to add equipment")
  return res.json()
}

export async function fetchEquipment(user: any, bedId: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/beds/${bedId}/equipment`, { headers: await authHeaders(user) })
  if (!res.ok) throw new Error("Failed to fetch equipment")
  return res.json()
}

export async function deleteEquipment(user: any, equipmentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/beds/equipment/${equipmentId}`, {
    method: "DELETE",
    headers: await authHeaders(user),
  })
  if (!res.ok) throw new Error("Failed to delete equipment")
}

// ─── BULK OPERATIONS ───────────────────────────────────────────────────────

export async function bulkCreateBeds(user: any, wardId: string, count: number, bedType?: string): Promise<Bed[]> {
  const res = await fetch(`${API_URL}/beds/${wardId}/bulk`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify({ count, bed_type: bedType }),
  })
  if (!res.ok) throw new Error("Failed to bulk create beds")
  return res.json()
}
