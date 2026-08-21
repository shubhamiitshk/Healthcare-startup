import { Monitor, Wifi, Clock, Users } from "lucide-react"
import Image from "next/image"

export function SmartTVIntegration() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Smart TV Queue Display</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Display live queue status on your clinic&apos;s TV or monitor. Patients can see their position and estimated wait
            time in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#1BBA8B]/10 rounded-lg flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-[#1BBA8B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Live Queue Display</h3>
                  <p className="text-gray-600">
                    Show current queue status, next patient, and estimated wait times on any TV or monitor in your
                    clinic.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#164772]/10 rounded-lg flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-[#164772]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
                  <p className="text-gray-600">
                    Automatic updates when patients check-in, appointments are delayed, or the queue moves forward.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Estimated Wait Times</h3>
                  <p className="text-gray-600">
                    Smart algorithms calculate and display accurate wait times based on historical data and current
                    pace.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reduce Anxiety</h3>
                  <p className="text-gray-600">
                    Patients feel more comfortable knowing exactly where they stand in the queue and when they&apos;ll be
                    seen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-black rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Image src="/logo.png" alt="CatchQ" width={32} height={32} className="w-8 h-8" />
                    <span className="text-xl font-bold text-[#164772]">CatchQ Live Queue</span>
                  </div>
                  <div className="text-sm text-gray-500">HealthCare Plus Clinic</div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#1BBA8B]/10 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[#164772]">Now Serving</div>
                        <div className="text-lg font-bold text-[#1BBA8B]">Token #12</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Dr. Sarah Johnson</div>
                        <div className="text-sm text-gray-500">Room 1</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-600">#13</div>
                      <div className="text-xs text-gray-600">Next</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">#14</div>
                      <div className="text-xs text-gray-600">Following</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Current Wait Time</div>
                      <div className="text-2xl font-bold text-[#164772]">15 mins</div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
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
