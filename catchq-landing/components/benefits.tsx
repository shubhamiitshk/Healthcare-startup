import { CheckCircle, TrendingUp, Users, Clock } from "lucide-react"

const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Revenue by 40%",
    description:
      "Reduce no-shows with automated reminders and optimize scheduling through both WhatsApp and mobile app.",
    stats: "40% Revenue Increase",
  },
  {
    icon: Clock,
    title: "Save 5 Hours Daily",
    description: "Automate appointment booking, digital receipts, and follow-up reminders across all platforms.",
    stats: "5 Hours Saved Daily",
  },
  {
    icon: Users,
    title: "Improve Patient Satisfaction",
    description: "Real-time updates, digital receipts, and seamless booking experience via WhatsApp and mobile app.",
    stats: "99% Patient Satisfaction",
  },
  {
    icon: CheckCircle,
    title: "Reduce No-Shows by 60%",
    description:
      "Multi-channel automated reminders via WhatsApp, app notifications, and SMS significantly reduce missed appointments.",
    stats: "60% Fewer No-Shows",
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-2 mb-6 border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
            <span className="text-[#1BBA8B] font-semibold text-sm uppercase tracking-wide">Benefits</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Transform Your Clinic Operations</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join hundreds of clinics that have revolutionized their patient management and seen remarkable improvements
            in efficiency and revenue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1BBA8B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-[#1BBA8B]" />
                </div>
                <div className="text-3xl font-bold text-[#1BBA8B] mb-2">{benefit.stats}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
