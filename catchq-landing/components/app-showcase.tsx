import { Button } from "@/components/ui/button"
import { Download, Star } from "lucide-react"
import Image from "next/image"

export function AppShowcase() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#164772]/5 to-[#1BBA8B]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Download the <span className="text-[#1BBA8B]">CatchQ Patient App</span>
              </h2>
              <p className="text-xl text-gray-600">
                Give your patients the convenience of booking appointments, tracking queues, and managing their
                healthcare journey right from their mobile device.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">Book appointments in seconds</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">View upcoming and past appointments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">Receive digital receipts instantly</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">Access detailed doctor profiles</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">Real-time queue updates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
                <span className="text-gray-700">Push notifications for reminders</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-[#164772] hover:bg-[#164772]/90 text-lg px-8 py-4">
                <Download className="w-5 h-5 mr-2" />
                Download for Android
              </Button>
              <Button size="lg" className="bg-[#1BBA8B] hover:bg-[#1BBA8B]/90 text-lg px-8 py-4">
                <Download className="w-5 h-5 mr-2" />
                Download for iOS
              </Button>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-gray-600">4.8/5 Rating</span>
              </div>
              <div className="text-gray-600">50,000+ Downloads</div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-[#164772] to-[#1BBA8B] rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Image src="/logo.png" alt="CatchQ" width={32} height={32} className="w-8 h-8" />
                    <span className="font-semibold text-[#164772]">CatchQ Patient</span>
                  </div>
                  <div className="text-sm text-gray-500">Today, 2:30 PM</div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#1BBA8B]/10 rounded-lg p-4">
                    <div className="font-semibold text-[#164772] mb-2">Upcoming Appointment</div>
                    <div className="text-sm text-gray-600">Dr. Sarah Johnson - Cardiology</div>
                    <div className="text-sm text-gray-600">Tomorrow, 10:00 AM</div>
                    <div className="text-xs text-[#1BBA8B] mt-2">Queue Position: #2 (Est. 10 mins)</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">Recent Visit</div>
                    <div className="text-sm text-gray-600">Dr. Mike Wilson - General Medicine</div>
                    <div className="text-sm text-gray-600">Yesterday, 3:00 PM</div>
                    <Button size="sm" variant="outline" className="mt-2 text-xs bg-transparent">
                      View Digital Receipt
                    </Button>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="font-semibold text-blue-900 mb-2">Follow-up Reminder</div>
                    <div className="text-sm text-blue-700">Blood test results discussion with Dr. Sarah Johnson</div>
                    <div className="text-xs text-blue-600 mt-1">Due in 3 days</div>
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
