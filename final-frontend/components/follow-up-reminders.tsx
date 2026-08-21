import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";


type FollowUp = {
  id: string;
  date: string;
  [key: string]: any;
};

export default function FollowUpReminders({ patientId = "" }) {
  const [reminders, setReminders] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/follow-ups-list?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => {
        const list: FollowUp[] = Array.isArray(data) ? data : data.data || [];
        setReminders(list.filter((f: FollowUp) => f.date === today));
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return null;
  if (loading) return null;
  if (!reminders.length) return null;

  return (
    <div className="mb-4 flex items-center gap-2 bg-[#E0F2EF] text-[#1BBA8D] p-3 rounded">
      <Bell className="w-5 h-5" />
      <span className="font-medium">You have {reminders.length} follow-up appointment(s) today.</span>
    </div>
  );
}
