"use client"

import { Button } from "@/components/ui/button"
import { Download, Users, Shield, Clock } from "lucide-react"
import { useEffect, useState } from "react"

export function MobileApps() {
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

    const section = document.getElementById("mobile-apps")
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="mobile-apps" className="py-20 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div
            className={`space-y-8 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-[#164772] leading-tight">
                Mobile Apps for Complete Experience
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Dedicated mobile applications for patients and staff to manage appointments, queue status, and clinic
                operations on the go.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#1BBA8B] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#164772] mb-2">Patient App Features</h3>
                  <p className="text-gray-600">
                    Book appointments, view history, get digital receipts, access doctor profiles
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#1BBA8B] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#164772] mb-2">Web App Features</h3>
                  <p className="text-gray-600">
                    Manage appointments, queue, doctor schedules, and real-time notifications
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#1BBA8B] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#164772] mb-2">Real-Time Sync</h3>
                  <p className="text-gray-600">
                    Instant synchronization across all platforms - WhatsApp, web, and mobile apps
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white transition-all duration-300 hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                Download for iOS
              </Button>
              <Button
                size="lg"
                className="bg-[#1BBA8B] hover:bg-[#164772] text-white transition-all duration-300 hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                Download for Android
              </Button>
            </div>
          </div>

          <div
            className={`relative transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="flex justify-center space-x-6">
              {/* Patient App Mockup */}
              <div className="relative transform hover:scale-105 transition-all duration-500 ease-out">
                <div className="bg-gradient-to-br from-[#1BBA8B] to-[#0ea574] rounded-3xl p-6 shadow-2xl w-64">
                  <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-6">Patient App</h3>

                  <div className="space-y-4">
                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Next Appointment</div>
                      <div className="text-white font-medium">Dr. Smith - 2:00 PM</div>
                    </div>

                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Queue Status</div>
                      <div className="text-white font-medium">2 patients ahead</div>
                    </div>

                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Digital Receipt</div>
                      <div className="text-white font-medium">₹500 - Paid</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Web App Mockup */}
              <div className="relative transform hover:scale-105 transition-all duration-500 ease-out">
                <div className="bg-gradient-to-br from-[#164772] to-[#0f3a5f] rounded-3xl p-6 shadow-2xl w-64">
                  <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-6">Web App</h3>

                  <div className="space-y-4">
                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Queue Management</div>
                      <div className="text-white font-medium">5 patients waiting</div>
                      <div className="text-white/70 text-xs mt-1">Now serving: Token #12</div>
                    </div>

                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Online Booking</div>
                      <div className="text-white font-medium">24 appointments today</div>
                      <div className="text-white/70 text-xs mt-1">18 via WhatsApp, 6 via app</div>
                    </div>

                    <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-white/90 text-sm mb-1">Revenue Tracking</div>
                      <div className="text-white font-medium">₹12,000 today</div>
                      <div className="text-white/70 text-xs mt-1">+15% from last week</div>
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
