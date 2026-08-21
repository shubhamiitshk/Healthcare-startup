"use client"

import { Calendar, MessageCircle, Clock, Users } from "lucide-react"
import { useEffect, useState } from "react"

export function DashboardShowcase() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    const section = document.getElementById("dashboard-showcase")
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="dashboard-showcase" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-2 mb-6 border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
            <span className="text-[#1BBA8B] font-semibold text-sm uppercase tracking-wide">Live Dashboard</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See Your <span className="text-[#1BBA8B]">Clinic in Action</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time appointment management with WhatsApp integration - everything synced automatically.
          </p>
        </div>

        <div
          className={`max-w-7xl mx-auto transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Dashboard Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#1BBA8B] rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">CatchQ Dashboard</h3>
                    <p className="text-sm text-gray-600">Dr. Smith&apos;s Clinic - Today&apos;s Schedule</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#1BBA8B]">24</div>
                    <div className="text-xs text-gray-600">Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-gray-600">Waiting</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-0">
              {/* Calendar View */}
              <div className="lg:col-span-2 p-8">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h4>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Grid with Appointments */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {Array.from({ length: 21 }, (_, i) => {
                    const hasAppointment = [2, 5, 8, 12, 15, 18].includes(i)
                    const appointmentTypes = [
                      { color: "bg-green-100 border-green-300 text-green-800", label: "General" },
                      { color: "bg-blue-100 border-blue-300 text-blue-800", label: "Cardiology" },
                      { color: "bg-purple-100 border-purple-300 text-purple-800", label: "Pediatrics" },
                      { color: "bg-orange-100 border-orange-300 text-orange-800", label: "Dermatology" },
                    ]
                    const appointment = appointmentTypes[i % 4]

                    return (
                      <div key={i} className="aspect-square relative">
                        <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-300 p-2 flex flex-col justify-between">
                          <span className="text-sm text-gray-700">{i + 1}</span>
                          {hasAppointment && (
                            <div className={`text-xs px-2 py-1 rounded border ${appointment.color} font-medium`}>
                              {appointment.label}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Today's Appointments */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h4>
                  <div className="space-y-3">
                    {[
                      { time: "9:00 AM", patient: "John Doe", type: "General Checkup", status: "completed" },
                      { time: "10:30 AM", patient: "Sarah Wilson", type: "Cardiology", status: "in-progress" },
                      { time: "2:00 PM", patient: "Mike Johnson", type: "Pediatrics", status: "waiting" },
                      { time: "3:30 PM", patient: "Emma Davis", type: "Dermatology", status: "scheduled" },
                    ].map((appointment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{appointment.patient}</div>
                            <div className="text-sm text-gray-600">{appointment.type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{appointment.time}</div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "waiting"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {appointment.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp Integration Panel */}
              <div className="bg-gray-50 p-8 border-l border-gray-200">
                <div className="flex items-center space-x-2 mb-6">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Live WhatsApp</h4>
                </div>

                <div className="space-y-4">
                  {/* WhatsApp Messages */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">New Booking</span>
                      <span className="text-xs text-gray-500">2 min ago</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-100 rounded-lg p-2 text-sm">
                        &quot;Hi! I need to book appointment with Dr. Smith&quot;
                      </div>
                      <div className="bg-[#1BBA8B] text-white rounded-lg p-2 text-sm ml-4">
                        &quot;Dr. Smith available tomorrow 10:00 AM. Confirm?&quot;
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2 text-sm">&quot;Yes, please book it&quot;</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Queue Update</span>
                      <span className="text-xs text-gray-500">5 min ago</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <div className="font-medium text-blue-900">Your appointment with Dr. Smith</div>
                      <div className="text-blue-700">Queue position: #2 (Est. 15 mins)</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₹</span>
                      </div>
                      <span className="font-medium text-gray-900">Payment Received</span>
                      <span className="text-xs text-gray-500">10 min ago</span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <div className="font-medium text-green-900">Payment successful - ₹500</div>
                      <div className="text-green-700">Digital receipt sent automatically</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h5 className="font-semibold text-gray-900 mb-3">Today&apos;s Activity</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#1BBA8B]">18</div>
                      <div className="text-xs text-gray-600">WhatsApp Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">6</div>
                      <div className="text-xs text-gray-600">App Bookings</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
