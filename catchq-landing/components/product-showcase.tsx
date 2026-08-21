"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useEffect, useState } from "react"

export function ProductShowcase() {
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

    const section = document.getElementById("product-showcase")
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="product-showcase" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div
            className={`space-y-8 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
          >
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                See CatchQ in <span className="text-[#1BBA8B] animate-pulse">Action</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Experience the power of WhatsApp booking, real-time queue management, and automated patient engagement
                all in one platform.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 transform hover:translate-x-1 transition-all duration-300 ease-out">
                <div className="w-3 h-3 bg-[#1BBA8B] rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Integration</h3>
                  <p className="text-gray-600">Seamless booking experience through WhatsApp chat interface</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 transform hover:translate-x-1 transition-all duration-300 ease-out">
                <div className="w-3 h-3 bg-[#164772] rounded-full mt-2" style={{ animationDelay: "0.2s" }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mobile App Experience</h3>
                  <p className="text-gray-600">Native mobile app with appointment history and digital receipts</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 transform hover:translate-x-1 transition-all duration-300 ease-out">
                <div className="w-3 h-3 bg-[#1BBA8B] rounded-full mt-2" style={{ animationDelay: "0.4s" }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart TV Display</h3>
                  <p className="text-gray-600">Live queue status displayed on clinic monitors</p>
                </div>
              </div>
            </div>

            <Button className="bg-[#164772] hover:bg-[#1BBA8B] px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl transform">
              Book a Demo
            </Button>
          </div>

          <div
            className={`relative transition-all duration-700 ease-out delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
          >
            <div className="grid grid-cols-2 gap-6">
              {/* WhatsApp Mockup */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-all duration-400 ease-out hover:scale-105">
                <div className="bg-green-500 rounded-t-2xl p-4 -m-6 mb-4">
                  <div className="text-white font-semibold">WhatsApp</div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-2xl p-3 animate-in slide-in-from-left duration-500">
                    <div className="text-sm text-gray-600">Hi! Book appointment</div>
                  </div>
                  <div className="bg-green-500 text-white rounded-2xl p-3 ml-8 animate-in slide-in-from-right duration-500 delay-300">
                    <div className="text-sm">Dr. Smith available at 2 PM. Confirm?</div>
                  </div>
                  <div className="text-center animate-in fade-in duration-500 delay-500">
                    <div className="text-2xl font-bold text-green-600 animate-bounce">#3</div>
                    <div className="text-xs text-gray-500">Queue Position</div>
                  </div>
                </div>
              </div>

              {/* Mobile App Mockup */}
              <div className="bg-gradient-to-br from-[#164772] to-[#1BBA8B] rounded-3xl shadow-2xl p-2 transform -rotate-2 hover:rotate-0 transition-all duration-400 ease-out hover:scale-105">
                <div className="bg-white rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Image src="/logo.png" alt="CatchQ" width={32} height={32} className="w-8 h-8" />
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-[#1BBA8B]/10 rounded-xl p-4 animate-in slide-in-from-top duration-500">
                      <div className="text-sm font-semibold text-[#164772]">Next Appointment</div>
                      <div className="text-xs text-gray-600">Dr. Johnson - 10:00 AM</div>
                      <div className="text-xs text-[#1BBA8B]">Queue: #2 (10 mins)</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 animate-in slide-in-from-bottom duration-500 delay-300">
                      <div className="text-sm font-semibold">Recent Visit</div>
                      <div className="text-xs text-gray-600">Digital Receipt Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TV Display Mockup */}
            <div className="mt-8 bg-black rounded-2xl p-4 shadow-2xl animate-in zoom-in duration-700 delay-500">
              <div className="bg-white rounded-xl p-4">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-[#164772] animate-pulse">Live Queue Display</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#1BBA8B]/10 rounded-lg p-2 animate-bounce">
                    <div className="text-lg font-bold text-[#1BBA8B]">#12</div>
                    <div className="text-xs">Now</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 animate-bounce" style={{ animationDelay: "0.2s" }}>
                    <div className="text-lg font-bold text-yellow-600">#13</div>
                    <div className="text-xs">Next</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 animate-bounce" style={{ animationDelay: "0.4s" }}>
                    <div className="text-lg font-bold text-blue-600">15m</div>
                    <div className="text-xs">Wait</div>
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
