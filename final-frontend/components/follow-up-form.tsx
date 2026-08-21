
import React, { useState, useEffect } from "react";
import { useFirebaseToken } from "../hooks/use-firebase-token";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getNext7Days } from "@/lib/queue/utils";

export function FollowUpForm({
  patientName = "",
  patientId = "",
  doctorId = "",
  doctorSchedules = [],
  onSuccess,
  onCancel,
}: {
  patientName: string;
  patientId: string;
  doctorId: string;
  doctorSchedules: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [reason, setReason] = useState("");
  const token = useFirebaseToken();
  const [type, setType] = useState("In-person");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDayObj, setSelectedDayObj] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const days = getNext7Days({ skipToday: true });
    setSelectedDayObj(days[0]);
    setSelectedDay(days[0].date);
  }, []);

  const slotsForSelectedDay = doctorSchedules.filter(
    (s: any) => selectedDayObj && s.day_of_week && s.day_of_week.trim().toLowerCase() === selectedDayObj.day.toLowerCase()
  );

  useEffect(() => {
    if (slotsForSelectedDay.length > 0) {
      setSelectedSlot(slotsForSelectedDay[0].id);
    } else {
      setSelectedSlot(null);
    }
  }, [selectedDayObj, doctorSchedules, slotsForSelectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Use the same endpoint as main queue booking
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          patientId,
          scheduleId: selectedSlot,
          date: selectedDayObj?.date,
          source: "web"
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to schedule follow-up");
      }
      setSuccess(true);
      setReason("");
      setType("In-person");
      setNotes("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white rounded-lg shadow p-8"
      style={{ borderColor: "#164772", borderWidth: 1 }}
    >
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "#164772" }}>
        Schedule Follow-Up
      </h2>
      <p className="mb-6 text-gray-600">Fill in the details below to schedule a new follow-up appointment.</p>
      {success && (
        <div className="mb-4 p-2 rounded text-white" style={{ backgroundColor: '#1BBA8D' }}>
          Follow-up scheduled successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 rounded text-white" style={{ backgroundColor: '#e53e3e' }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient Name</label>
          <Input value={patientName} disabled className="bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reason for Follow-Up</label>
          <Input
            placeholder="e.g., Post-operative check-up"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Appointment Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            style={{ borderColor: "#164772" }}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option>In-person</option>
            <option>Online</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Day</label>
          <Select
            value={selectedDayObj?.date ?? ''}
            onValueChange={val => {
              const found = getNext7Days().find(d => d.date === val);
              if (found) {
                setSelectedDayObj(found);
                setSelectedDay(val);
              }
            }}
          >
            <SelectTrigger className="w-full h-9">
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
        <div>
          <label className="block text-sm font-medium mb-1">Slot</label>
          <Select
            value={selectedSlot ?? undefined}
            onValueChange={val => setSelectedSlot(val)}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select slot" />
            </SelectTrigger>
            <SelectContent>
              {slotsForSelectedDay.length > 0 ? (
                slotsForSelectedDay.map((sch: any) => (
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
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Notes/Instructions for Patient</label>
        <Textarea
          placeholder="e.g., Please bring your latest test results."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" style={{ color: "#164772", borderColor: "#164772" }} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" style={{ backgroundColor: "#1BBA8D", color: "white" }} disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Appointment'}
        </Button>
      </div>
    </form>
  );
}
