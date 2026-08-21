"use client"

import {
  MessageCircle,
  Smartphone,
  Clock,
  Bell,
  CreditCard,
  Receipt,
  BarChart3,
  Monitor,
  Users,
  Shield,
  Phone,
} from "lucide-react"
import { useEffect, useState } from "react"

const featureCategories = [
  {
    title: "Patient Experience",
    subtitle: "Delight at every touchpoint",
    features: [
      {
        icon: MessageCircle,
        name: "WhatsApp Booking",
        description: "Book appointments via chat in 30 seconds",
      },
      {
        icon: Smartphone,
        name: "Mobile Apps",
        description: "iOS & Android apps with 4.9★ rating",
      },
      {
        icon: Receipt,
        name: "Digital Receipts",
        description: "Instant receipts via WhatsApp & email",
      },
    ],
  },
  {
    title: "Clinic Operations",
    subtitle: "Streamline your workflow",
    features: [
      {
        icon: BarChart3,
        name: "Analytics Dashboard",
        description: "Real-time insights & performance metrics",
      },
      {
        icon: Users,
        name: "Staff Web Portal",
        description: "Comprehensive clinic management system",
      },
      {
        icon: Monitor,
        name: "Smart TV Display",
        description: "Live queue status on clinic screens",
      },
    ],
  },
  {
    title: "Automation",
    subtitle: "Set it and forget it",
    features: [
      {
        icon: Bell,
        name: "Smart Reminders",
        description: "Automated appointment & follow-up alerts",
      },
      {
        icon: Clock,
        name: "Queue Updates",
        description: "Real-time position & wait time notifications",
      },
      {
        icon: Phone,
        name: "Follow-up System",
        description: "Automated patient retention workflows",
      },
    ],
  },
  {
    title: "Payments & Billing",
    subtitle: "Money matters made simple",
    features: [
      {
        icon: CreditCard,
        name: "Secure Payments",
        description: "Multiple payment gateways & methods",
      },
      {
        icon: Receipt,
        name: "Auto Receipts",
        description: "Instant digital receipts & invoicing",
      },
      {
        icon: BarChart3,
        name: "Revenue Tracking",
        description: "Financial analytics & reporting tools",
      },
    ],
  },
]

export function Features() {
  const [visibleCategories, setVisibleCategories] = useState<number[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.getAttribute("data-index") || "0")
            setVisibleCategories((prev) => [...prev, index])
          }
        })
      },
      { threshold: 0.1 },
    )

    const categories = document.querySelectorAll(".feature-category")
    categories.forEach((category) => observer.observe(category))

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-6 py-2 mb-6 border border-gray-200">
            <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
            <span className="text-[#1BBA8B] font-semibold text-sm uppercase tracking-wide">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Complete <span className="text-[#1BBA8B]">Clinic Management</span> Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything your clinic needs organized by capability - from patient experience to revenue management.
          </p>
        </div>

        {/* Capability Matrix Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {featureCategories.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                data-index={categoryIndex}
                className={`feature-category transition-all duration-700 ease-out ${
                  visibleCategories.includes(categoryIndex) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${categoryIndex * 200}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 group">
                  {/* Category Header */}
                  <div className="bg-gray-50 p-4 border-b border-gray-100 relative">
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-1 text-gray-900">{category.title}</h3>
                      <p className="text-gray-600">{category.subtitle}</p>
                    </div>

                    {/* Subtle decorative element */}
                    <div className="absolute top-3 right-3 w-12 h-12 bg-[#1BBA8B]/5 rounded-full"></div>
                  </div>

                  {/* Features Grid */}
                  <div className="p-4">
                    <div className="grid gap-3">
                      {category.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-300 group/feature border border-transparent hover:border-gray-100"
                        >
                          {/* Feature Icon */}
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm group-hover/feature:bg-[#1BBA8B] group-hover/feature:text-white transition-all duration-300 border border-gray-200">
                            <feature.icon className="w-5 h-5 text-gray-600 group-hover/feature:text-white transition-colors duration-300" />
                          </div>

                          {/* Feature Content */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 group-hover/feature:text-[#164772] transition-colors duration-300">
                              {feature.name}
                            </h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                          </div>

                          {/* Hover indicator */}
                          <div className="w-1.5 h-1.5 bg-[#1BBA8B] rounded-full opacity-0 group-hover/feature:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ))}
                    </div>

                    {/* Category Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{category.features.length} features</span>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-[#1BBA8B]" />
                          <span className="text-[#1BBA8B] font-medium">Enterprise Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Overview */}
        <div className="mt-16">
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Complete Platform Integration</h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              All features work seamlessly together to create a unified clinic management experience.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1 text-[#1BBA8B]">12+</div>
                <div className="text-gray-600 text-sm">Core Features</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1 text-[#1BBA8B]">4</div>
                <div className="text-gray-600 text-sm">Platform Areas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1 text-[#1BBA8B]">99.9%</div>
                <div className="text-gray-600 text-sm">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1 text-[#1BBA8B]">24/7</div>
                <div className="text-gray-600 text-sm">Support</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#1BBA8B] text-white hover:bg-[#0ea574] px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-sm">
                Explore All Features
              </button>
              <button className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
