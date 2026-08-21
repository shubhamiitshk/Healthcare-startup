import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    period: "/month",
    description: "Perfect for small clinics",
    features: [
      "WhatsApp booking",
      "Up to 2 doctors",
      "Basic queue management",
      "Digital receipts",
      "Email support",
      "Mobile app access",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "₹5,999",
    period: "/month",
    description: "Most popular for growing clinics",
    features: [
      "Everything in Starter",
      "Up to 5 doctors",
      "Smart TV queue display",
      "Advanced analytics",
      "Automated reminders",
      "Priority support",
      "Custom branding",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₹9,999",
    period: "/month",
    description: "For large clinics and hospitals",
    features: [
      "Everything in Professional",
      "Unlimited doctors",
      "Multi-location support",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "24/7 phone support",
    ],
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your clinic. All plans include a 14-day free trial with no setup fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                plan.popular ? "border-[#1BBA8B] relative" : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#1BBA8B] text-white px-6 py-2 rounded-full text-sm font-medium">Most Popular</div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xl text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-[#1BBA8B] flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-3 text-lg font-medium ${
                  plan.popular ? "bg-[#1BBA8B] hover:bg-[#164772]" : "bg-gray-900 hover:bg-[#164772] text-white"
                }`}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">Need a custom solution? We&apos;ve got you covered.</p>
          <Button
            variant="outline"
            className="border-[#164772] text-[#164772] hover:bg-[#164772] hover:text-white px-8 py-3 bg-transparent"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  )
}
