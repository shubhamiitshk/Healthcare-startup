import React from "react";

export type BillDetails = {
  id: string;
  patientName: string;
  date: string;
  amount: number;
  status: string;
  details: string;
  paymentMode?: string;
  discount?: number;
  notes?: string;
  clinicName?: string;
  clinicAddress?: string;
};

export function BillDetailsModal({ open, onClose, bill }: {
  open: boolean;
  onClose: () => void;
  bill: BillDetails | null;
}) {
  if (!open || !bill) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[350px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-4 text-[#164772]">Bill Details</h2>
        <div className="mb-2"><b>Patient:</b> {bill.patientName}</div>
        <div className="mb-2"><b>Date:</b> {bill.date}</div>
        <div className="mb-2"><b>Amount:</b> ${bill.amount.toFixed(2)}</div>
        <div className="mb-2"><b>Status:</b> {bill.status}</div>
        <div className="mb-2"><b>Payment Mode:</b> {bill.paymentMode || '-'}</div>
        {typeof bill.discount === 'number' && bill.discount > 0 && (
          <div className="mb-2"><b>Discount:</b> ${bill.discount.toFixed(2)}</div>
        )}
        <div className="mb-2"><b>Details:</b> {bill.details}</div>
        {bill.notes && <div className="mb-2"><b>Notes:</b> {bill.notes}</div>}
        <button className="px-4 py-2 rounded bg-[#1BBA8D] text-white font-semibold" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export function GenerateBillModal({ open, onClose, onSubmit, patients = [], doctors = [], schedules = [] }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { patientId: string; scheduleId: string; amount: number; details: string; paymentMode: string; discount: number; notes: string }) => void;
  patients?: any[];
  doctors?: any[];
  schedules?: any[];
}) {
  const [patientId, setPatientId] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");
  const [scheduleId, setScheduleId] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [details, setDetails] = React.useState("");
  const [paymentMode, setPaymentMode] = React.useState("Cash");
  const [discount, setDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setPatientId("");
      setDoctorId("");
      setScheduleId("");
      setAmount(0);
      setDetails("");
      setPaymentMode("Cash");
      setDiscount(0);
      setNotes("");
    }
  }, [open]);

  // When doctor changes, reset schedule
  React.useEffect(() => {
    setScheduleId("");
  }, [doctorId]);

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form
        className="bg-white rounded-lg shadow-lg p-8 min-w-[350px] max-w-[95vw] max-h-[90vh] w-full sm:w-[400px] flex flex-col"
        style={{ overflowY: 'auto' }}
        onSubmit={e => {
          e.preventDefault();
          if (!patientId || !doctorId || !scheduleId) return;
          onSubmit({ patientId, scheduleId, amount, details, paymentMode, discount, notes });
        }}
      >
        <h2 className="text-xl font-bold mb-4 text-[#164772]">Generate Bill</h2>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Doctor</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={doctorId}
            onChange={e => setDoctorId(e.target.value)}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Schedule</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={scheduleId}
            onChange={e => setScheduleId(e.target.value)}
            required
          >
            <option value="">Select Schedule</option>
            {schedules
              .filter(s => {
                // support both flat doctor_id and nested doctor.id
                const schedDocId = s.doctor_id ?? s.doctor?.id;
                return schedDocId?.toString() === doctorId;
              })
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.day_of_week} {s.start_time} - {s.end_time}
                </option>
              ))
            }
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Patient</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            required
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName || p.phone_number}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Amount</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={amount} onChange={e => setAmount(Number(e.target.value))} required min={1} />
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Payment Mode</label>
          <select className="w-full border rounded px-3 py-2" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Discount</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={0} />
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Details</label>
          <textarea className="w-full border rounded px-3 py-2" value={details} onChange={e => setDetails(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Notes</label>
          <textarea className="w-full border rounded px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-4 py-2 rounded bg-gray-200 text-[#164772] font-semibold" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-[#1BBA8D] text-white font-semibold">Generate</button>
        </div>
      </form>
    </div>
  ) : null;
}
