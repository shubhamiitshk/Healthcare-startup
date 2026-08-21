
"use client";
import React, { useEffect, useState, useCallback } from "react";
import Layout from "@/components/layout";
import { useAuth } from "@/components/auth-provider";
import { BillDetailsModal, GenerateBillModal, BillDetails } from "./BillingModals";
import { PrintBillModal } from "./PrintBillModal";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePickerPatients } from "@/components/date-picker-patients";
import { format } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";


// Match the AppointmentRow type from queue page
type Bill = {
  id: string;
  doctorId?: string;
  queueNo?: number;
  patientName: string;
  phone?: string;
  sex?: string;
  doctor?: string;
  date: string;
  amount: number;
  status: string;
  source?: string;
  details?: string;
  paymentMode?: string;
  discount?: number;
  notes?: string;
  clinicName?: string;
  clinicAddress?: string;
};


export default function BillingPage() {
  const { clinic, user } = useAuth();
  const [search, setSearch] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillDetails | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printBill, setPrintBill] = useState<BillDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  // Extract unique patients from bills/appointments (improved: use patientId and patientName)
  useEffect(() => {
    const unique: { [id: string]: any } = {};
    bills.forEach((bill: any) => {
      // Try to extract patientId and patientName from bill
      let patientId = bill.patientId || bill.patient_id || bill.phone || bill.patientName;
      let patientName = bill.patientName || bill.patient_name || bill.family_member_name || bill.family_member_id || 'Unknown';
      if (patientId && patientName && patientName !== 'Unknown') {
        if (!unique[patientId]) {
          unique[patientId] = {
            id: patientId,
            fullName: patientName,
            phone_number: bill.phone,
            gender: bill.sex,
          };
        }
      }
    });
    setPatients(Object.values(unique));
  }, [bills]);

  // Fetch schedules for the clinic
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user || !clinic) return;
      try {
        const token = await user.getIdToken();
        const resp = await fetch(`${API_URL}/doctors/schedules?clinicId=${clinic.id}`,
          { headers: { Authorization: `Bearer ${token}` } });
        if (resp.ok) {
          const data = await resp.json();
          setSchedules(Array.isArray(data.data) ? data.data : []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchSchedules();
  }, [user, clinic]);

  // Fetch all appointments for the clinic and map to billing table
  // Fetch doctors for the clinic
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user || !clinic) return;
      try {
        const token = await user.getIdToken();
        const resp = await fetch(`${API_URL}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          // Filter doctors for this clinic only (if needed)
          const allDoctors = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          const filtered = allDoctors.filter((doc: any) => 
            String(doc.clinic_id)  === String(clinic.id)  ||
            String(doc.clinic?.id) === String(clinic.id)  ||
            String(doc.clinicId)   === String(clinic.id)
            );
          setDoctors(filtered);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchDoctors();
  }, [user, clinic]);

  // Fetch bills for the clinic, doctor, and date
  const fetchBills = useCallback(async () => {
    if (!user || !clinic) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (selectedDoctor !== "all") params.append("doctorId", selectedDoctor);
      if (date) params.append("date", format(date, "yyyy-MM-dd"));
      const resp = await fetch(`${API_URL}/appointments/clinic?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      console.log('Billing API response:', data); // DEBUG
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('First item in data.data:', data.data[0]);
      }
      let mapped: Bill[] = [];
      if (resp.ok) {
        // unwrap either data.data or raw data array
        const appts = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        mapped = appts.map((a: any) => {
          // Fallback mapping for flat appointment objects
          // prefer nested patient/familyMember objects before falling back to flat fields
          let patientName = a.patient?.fullName
                          || a.familyMember?.name
                          || a.patient_name
                          || a.patientName
                          || a.family_member_name
                          || 'Unknown';
          let patientId   = a.patient?.id
                          || a.familyMember?.id
                          || a.patient_id
                          || a.patientId
                          || undefined;
          let phone = a.patient?.phone_number
                    || a.familyMember?.phone_number
                    || a.phone_number
                    || '-';
          let sex = a.patient?.gender
                   || a.familyMember?.gender
                   || '-';
          // Doctor display: prefer name, fallback to id
          let doctor = a.schedule?.doctor?.name
                     || a.doctor_name
                     || '-';
          let doctorId = a.schedule?.doctor?.id
                       || a.doctor_id
                       || a.doctorId
                       || undefined;
          let clinicName    = a.clinic_name   || clinic.name;
          let clinicAddress = a.clinic_address || clinic.address;
          let amount = Number(a.fees || a.amount || 0);
          return {
            id: a.id,
            doctorId,
            queueNo: a.queue_number || '-',
            patientName,
            patientId,
            phone,
            sex,
            doctor,
            date: a.date || '',
            amount,
            status: a.status === 'completed' ? 'Paid' : 'Unpaid',
            source: a.source || 'web',
            details: a.details || a.notes || '-',
            paymentMode: a.payment_mode || a.paymentMode || 'Cash',
            discount: a.discount || 0,
            notes: a.notes || '',
            clinicName,
            clinicAddress,
          };
        });
      }
      setBills(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, clinic, selectedDoctor, date]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = bills
    // 1: if a specific doctor is chosen, only keep that doctor's rows
    .filter(bill =>
      selectedDoctor === 'all' ||
      bill.doctorId === selectedDoctor
    )
    // 2: then apply your existing text‐search
    .filter(bill =>
      bill.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (bill.phone && bill.phone.includes(search)) ||
      (bill.doctor && bill.doctor.toLowerCase().includes(search.toLowerCase()))
    );

  // Mark as Paid
  const markAsPaid = async (bill: Bill) => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken?.();
      const resp = await fetch(`${API_URL}/appointments/${bill.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!resp.ok) throw new Error("Failed to mark as paid");
      setBills(bills => bills.map(b => b.id === bill.id ? { ...b, status: "Paid" } : b));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // View Details

  const handleViewDetails = (bill: Bill) => {
    // Ensure details is always a string (not undefined)
    setSelectedBill({
      ...bill,
      details: bill.details ?? "-"
    });
    setShowDetails(true);
  };

  // Print Bill

  const handlePrintBill = (bill: Bill) => {
    setPrintBill({
      ...bill,
      details: bill.details ?? "-"
    });
    setShowPrint(true);
  };

  // Generate Bill
  const handleGenerateBill = async (data: { patientId: string; scheduleId: string; amount: number; details: string; paymentMode: string; discount: number; notes: string }) => {
    setLoading(true);
    setError(null);
    try {
      const token = await user?.getIdToken?.();
      // Simulate bill as appointment (minimal fields)
      const resp = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: data.patientId,
          scheduleId: data.scheduleId,
          date: new Date().toISOString().slice(0, 10),
          fees: data.amount,
          notes: data.details,
          paymentMode: data.paymentMode,
          discount: data.discount,
          extraNotes: data.notes,
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate bill");
      // Optionally, you can fetch the patient name and other details if needed
      // For now, just refresh bills
      fetchBills();
      setShowGenerate(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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
      <div className="p-8 bg-[#F8F9FB] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#164772]">Billing & Payments</h1>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold"
            style={{ background: '#1BBA8D' }}
            onClick={() => setShowGenerate(true)}
            disabled={loading}
          >
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>+</span> Generate Bill
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex gap-2 items-center">
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
          </div>
          <div>
            <DatePickerPatients
              appointments={[]}
              selectedDoctorId={selectedDoctor}
              onDateSelect={d => setDate(d)}
            />
          </div>
          <input
            type="text"
            placeholder="Search invoices by patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-72 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1BBA8D]"
            style={{ maxWidth: 300 }}
          />
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow text-sm">
            <thead>
              <tr className="text-left text-[#164772] font-semibold border-b">
                <th className="px-4 py-3">QUEUE NO.</th>
                <th className="px-4 py-3">PATIENT NAME</th>
                <th className="px-4 py-3">PHONE</th>
                <th className="px-4 py-3">SEX</th>
                <th className="px-4 py-3">DOCTOR</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-b last:border-b-0 hover:bg-[#F3F7FA]">
                  <td className="px-4 py-4">{bill.queueNo ?? '-'}</td>
                  <td className="px-4 py-4 font-medium">{bill.patientName}</td>
                  <td className="px-4 py-4">{bill.phone || '-'}</td>
                  <td className="px-4 py-4">{bill.sex || '-'}</td>
                  <td className="px-4 py-4">{bill.doctor || '-'}</td>
                  <td className="px-4 py-4">{bill.date}</td>
                  <td className="px-4 py-4">₹{bill.amount.toFixed(2)}</td>
                  <td className="px-4 py-4">
                    {bill.status === "Paid" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E6FAF3] text-[#1BBA8D]">Paid</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FDECEC] text-[#164772]">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-4 flex gap-2 items-center">
                    <button
                      className="text-[#164772] font-semibold hover:underline border border-[#164772] px-2 py-1 rounded"
                      style={{ minWidth: 70 }}
                      onClick={() => handlePrintBill(bill)}
                      disabled={loading}
                    >
                      Print
                    </button>
                    {bill.status === "Unpaid" && (
                      <button
                        className="px-3 py-1 rounded-lg text-white font-semibold"
                        style={{ background: '#164772' }}
                        onClick={() => markAsPaid(bill)}
                        disabled={loading}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No billing records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <BillDetailsModal open={showDetails} onClose={() => setShowDetails(false)} bill={selectedBill} />
        <GenerateBillModal
          open={showGenerate}
          onClose={() => setShowGenerate(false)}
          onSubmit={handleGenerateBill}
          patients={patients}
          doctors={doctors}
          schedules={schedules}
        />
        <PrintBillModal open={showPrint} onClose={() => setShowPrint(false)} bill={printBill} />
      </div>
    </Layout>
  );
}
