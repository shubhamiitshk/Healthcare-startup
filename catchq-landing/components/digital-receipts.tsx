import { Receipt, Download, Mail } from "lucide-react"
import Image from "next/image"

export function DigitalReceipts() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                <span className="text-[#1BBA8B]">Digital Receipts</span> & Payment Management
              </h2>
              <p className="text-xl text-gray-600">
                Patients receive instant digital receipts for every payment via WhatsApp and mobile app. Secure,
                eco-friendly, and always accessible.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#1BBA8B]/10 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-[#1BBA8B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Digital Receipts</h3>
                  <p className="text-gray-600">
                    Automatic receipt generation and delivery via WhatsApp and app notifications immediately after
                    payment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#164772]/10 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-[#164772]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Download & Share</h3>
                  <p className="text-gray-600">
                    Patients can download receipts as PDF, share via email, or access them anytime from their app
                    history.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multiple Delivery Options</h3>
                  <p className="text-gray-600">
                    Receipts delivered via WhatsApp, email, SMS, and stored in the mobile app for easy access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <Image src="/logo.png" alt="CatchQ" width={32} height={32} className="w-8 h-8" />
                  <div className="text-sm text-gray-500">Digital Receipt</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#164772]">HealthCare Plus Clinic</h3>
                  <p className="text-sm text-gray-600">123 Medical Street, City</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Patient</div>
                      <div className="font-medium">John Doe</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Date</div>
                      <div className="font-medium">Jan 15, 2024</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Doctor</div>
                      <div className="font-medium">Dr. Sarah Johnson</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Receipt #</div>
                      <div className="font-medium">CQ-2024-001</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consultation Fee</span>
                    <span>₹500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lab Tests</span>
                    <span>₹300</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#164772] border-t pt-2">
                    <span>Total Paid</span>
                    <span>₹800</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#1BBA8B] text-white py-2 px-4 rounded-lg text-sm">Download PDF</button>
                  <button className="flex-1 border border-[#164772] text-[#164772] py-2 px-4 rounded-lg text-sm">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
