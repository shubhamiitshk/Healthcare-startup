"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Clock, Activity, TrendingUp, UserCheck, Bot, Sparkles } from "lucide-react"
import Layout from "@/components/layout"
import { useAuth } from "@/components/auth-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartContainer } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { BarChart, Bar, Legend } from "recharts"
import { AiReceptionistModal } from "@/components/ai-receptionist-modal"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// Animated counter hook
function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * (target - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
      else setValue(target);
    }
    if (target !== undefined && target !== null) {
      requestAnimationFrame(animate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export default function DashboardPage() {
  const router = useRouter();
  const { clinic, user, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    waitingPatients: 0,
    completedToday: 0,
    avgWaitTime: "-",
    doctorsAvailable: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [statusTrendData, setStatusTrendData] = useState<{ date: string; completed: number; waiting: number }[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Animated numbers
  const animatedPatients = useAnimatedNumber(stats.totalPatients);
  const animatedAppointments = useAnimatedNumber(stats.todayAppointments);
  const animatedWaiting = useAnimatedNumber(stats.waitingPatients);
  const animatedCompleted = useAnimatedNumber(stats.completedToday);
  const animatedDoctors = useAnimatedNumber(stats.doctorsAvailable);

  useEffect(() => {
    if (!clinic || !user) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const today = new Date();
        // Fetch last 7 days' appointment counts and status breakdown
        const trendPromises = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (6 - i));
          const dateStr = d.toISOString().slice(0, 10);
          return fetch(`${API_URL}/appointments/clinic?date=${dateStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((resp) => resp.json())
            .then((data) => {
              const appts = data.data ?? data;
              return {
                date: dateStr,
                count: appts.length || 0,
                completed: appts.filter((a: any) => a.status === "completed").length,
                waiting: appts.filter((a: any) => a.status === "waiting").length,
              };
            });
        });
        const trendResults = await Promise.all(trendPromises);
        setTrendData(trendResults.map(d => ({ date: d.date, count: d.count })));
        setStatusTrendData(trendResults.map(d => ({ date: d.date, completed: d.completed, waiting: d.waiting })));
        // Fetch all appointments for today
        const apptResp = await fetch(`${API_URL}/appointments/clinic?date=${today.toISOString().slice(0, 10)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const apptData = await apptResp.json();
        const appointments = apptData.data ?? apptData;
        // Count stats
        const todayAppointments = appointments.length;
        const waitingPatients = appointments.filter((a: any) => a.status === "waiting").length;
        const completedToday = appointments.filter((a: any) => a.status === "completed").length;
        // Fetch all doctors
        const docResp = await fetch(`${API_URL}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docData = await docResp.json();
        const doctors = docData.data ?? docData;
        // For now, count unique patient ids from today's appointments
        const uniquePatientIds = new Set(
          appointments.map((a: any) => a.patient?.id || a.familyMember?.id || "")
        );
        // Recent activity: latest 5 appointments (order by created_at or date desc)
        const recentResp = await fetch(`${API_URL}/appointments/clinic?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const recentData = await recentResp.json();
        const recent = (recentData.data ?? recentData).slice(0, 5);
        setStats({
          totalPatients: uniquePatientIds.size,
          todayAppointments,
          waitingPatients,
          completedToday,
          avgWaitTime: "-", // Stubbed, can be calculated if timestamps available
          doctorsAvailable: doctors.length,
        });
        setRecentActivity(recent);
      } catch (err) {
        setStats({
          totalPatients: 0,
          todayAppointments: 0,
          waitingPatients: 0,
          completedToday: 0,
          avgWaitTime: "-",
          doctorsAvailable: 0,
        });
        setRecentActivity([]);
        setTrendData([]);
        setStatusTrendData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [clinic, user]);

  const statCards = [
    {
      title: "Total Patients Today",
      icon: <Users className="h-4 w-4 text-[#1BBA8D]" />, 
      value: loading ? "-" : animatedPatients,
      tooltip: "Unique patients with appointments today.",
      onClick: () => router.push("/appointments"),
      interactive: true,
    },
    {
      title: "Appointments Today",
      icon: <Calendar className="h-4 w-4 text-[#1BBA8D]" />, 
      value: loading ? "-" : animatedAppointments,
      tooltip: "Total appointments booked today.",
      onClick: () => router.push("/appointments"),
      interactive: true,
    },
    {
      title: "Currently Waiting",
      icon: <Clock className="h-4 w-4 text-orange-500 animate-pulse" />, 
      value: loading ? "-" : animatedWaiting,
      tooltip: "Patients currently waiting in the queue.",
      onClick: () => router.push("/queue"),
      interactive: true,
    },
    {
      title: "Completed Today",
      icon: <Activity className="h-4 w-4 text-green-500 animate-bounce" />, 
      value: loading ? "-" : animatedCompleted,
      tooltip: "Consultations completed today.",
      onClick: () => router.push("/appointments?status=completed"),
      interactive: true,
    },
    {
      title: "Doctors Available",
      icon: <UserCheck className="h-4 w-4 text-[#1BBA8D]" />, 
      value: loading ? "-" : animatedDoctors,
      tooltip: "Total doctors in clinic.",
      onClick: () => router.push("/doctors"),
      interactive: true,
    },
    {
      title: "Performance",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />, 
      value: "95%",
      tooltip: "Patient satisfaction (static)",
      onClick: undefined,
      interactive: false,
    },
  ];

  const quickActions = [
    {
      title: "AI Voice Receptionist",
      description: "Live Voice AI simulator (Twilio/Whisper/LLM)",
      icon: Bot,
      action: () => setAiModalOpen(true),
      color: "bg-gradient-to-r from-[#164772] to-[#1BBA8D]",
    },
    {
      title: "Add Patient",
      description: "Add a new patient to queue",
      icon: Users,
      action: () => router.push("/queue"),
      color: "bg-[#1BBA8D]",
    },
    {
      title: "View Queue",
      description: "Manage patient queue",
      icon: Clock,
      action: () => router.push("/queue"),
      color: "bg-[#164772]",
    },
    {
      title: "Schedule Appointment",
      description: "Book new appointment",
      icon: Calendar,
      action: () => router.push("/appointments"),
      color: "bg-orange-500",
    },
    {
      title: "Manage Doctors",
      description: "View doctor schedules",
      icon: UserCheck,
      action: () => router.push("/doctors"),
      color: "bg-purple-500",
    },
  ];

  return (
    <Layout>
      <style jsx global>{`
        @media (min-width: 768px) {
          .appointments-sidebar {
            width: 12rem !important;
          }
        }
      `}</style>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#164772]">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>
          <Button
            onClick={() => setAiModalOpen(true)}
            className="bg-gradient-to-r from-[#164772] to-[#1BBA8D] hover:opacity-90 text-white shadow-md flex items-center gap-2 h-11 px-5 rounded-xl font-medium"
          >
            <Bot className="w-5 h-5" />
            <span>Test AI Receptionist</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </Button>
        </div>

        {/* Stats Grid */}
        <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, idx) => (
            <Tooltip key={card.title}>
              <TooltipTrigger asChild>
                <Card
                  onClick={card.interactive ? card.onClick : undefined}
                  className={`transition-all duration-200 cursor-${card.interactive ? "pointer" : "default"} hover:shadow-xl hover:scale-[1.03] active:scale-95 ${card.interactive ? "hover:ring-2 hover:ring-[#1BBA8D]" : ""}`}
                  tabIndex={card.interactive ? 0 : -1}
                  role={card.interactive ? "button" : undefined}
                  aria-label={card.title}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#164772] min-h-[2.5rem]">{card.value}</div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>{card.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        </TooltipProvider>

        {/* Graphs Grid */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointments Trend Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#164772]">Appointments Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="count" stroke="#1BBA8D" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Completed vs Waiting Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#164772]">Completed vs Waiting (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#1BBA8D" name="Completed" />
                    <Bar dataKey="waiting" fill="#F59E0B" name="Waiting" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#164772] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#164772] mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button variant="outline" size="sm" onClick={action.action} className="w-full">
                    Go to {action.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#164772]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <div className="text-gray-500 text-sm">No recent activity.</div>
              )}
              {recentActivity.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === "completed"
                      ? "bg-[#1BBA8D]"
                      : item.status === "waiting"
                      ? "bg-orange-500"
                      : "bg-[#164772]"
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.patient?.fullName || item.familyMember?.name || "Unknown"} {item.status === "completed" ? "completed consultation" : item.status === "waiting" ? "is waiting" : item.status === "serving" ? "is being served" : item.status}
                      {item.schedule?.doctor?.name ? ` with Dr. ${item.schedule.doctor.name}` : ""}
                    </p>
                    <p className="text-xs text-gray-600">{item.date ? new Date(item.date).toLocaleString() : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AiReceptionistModal open={aiModalOpen} onOpenChange={setAiModalOpen} />
    </Layout>
  );
}
