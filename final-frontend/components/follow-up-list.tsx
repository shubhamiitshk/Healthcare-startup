
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type FollowUp = {
  id: string;
  reason: string;
  appointmentType: string;
  date: string;
  time: string;
  notes?: string;
};

export default function FollowUpList({ patientId = "", clinicId = "" }) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    let url = "/api/follow-ups-list";
    if (patientId) url += `?patientId=${patientId}`;
    else if (clinicId) url += `?clinicId=${clinicId}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFollowUps(data as FollowUp[]);
        else if (Array.isArray(data.data)) setFollowUps(data.data as FollowUp[]);
        else setFollowUps([]);
      })
      .catch(() => setError("Failed to load follow-ups"))
      .finally(() => setLoading(false));
  }, [patientId, clinicId]);

  if (loading) return <div>Loading follow-ups...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!followUps.length) return <div>No follow-ups found.</div>;

  return (
    <div className="space-y-4">
      {followUps.map((f, i) => (
        <Card key={f.id || i} className="p-4 flex flex-col gap-2">
          <div className="font-semibold text-[#164772]">{f.reason}</div>
          <div className="text-sm text-gray-600">{f.date} at {f.time} ({f.appointmentType})</div>
          {f.notes && <div className="text-xs text-gray-500">Notes: {f.notes}</div>}
        </Card>
      ))}
    </div>
  );
}
