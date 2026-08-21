"use client"

import { MessageCircle, Calendar, Clock, CreditCard, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

type WhatsAppMockup = { type: "whatsapp"; messages: { type: "user" | "bot"; text: string }[] }
type AppMockup = {
  type: "app"
  content: { doctor: string; specialty: string; rating: string; slots: string[]; selected: string }
}
type QueueMockup = {
  type: "queue"
  content: { position: string; waitTime: string; status: string; currentToken: string }
}
type ReceiptMockup = {
  type: "receipt"
  content: { amount: string; doctor: string; date: string; status: string; receiptId: string }
}
type Step = {
  icon: typeof MessageCircle
  title: string
  description: string
  step: string
  mockup: WhatsAppMockup | AppMockup | QueueMockup | ReceiptMockup
}

const steps: Step[] = [
  {
    icon: MessageCircle,
    title: "Chat to Book",
    description: "Natural conversation starts your appointment",
    step: "01",
    mockup: {
      type: "whatsapp",
      messages: [
        { type: "user", text: "Hi! I need to book appointment" },
        { type: "bot", text: "Hello! I can help you book. Which doctor?" },
        { type: "user", text: "Dr. Smith please" },
        { type: "bot", text: "Dr. Smith available today 2:00 PM. Book?" },
      ],
    },
  },
  {
    icon: Calendar,
    title: "Choose Your Care",
    description: "Browse doctors with ratings and availability",
    step: "02",
    mockup: {
      type: "app",
      content: {
        doctor: "Dr. Sarah Smith",
        specialty: "Cardiology",
        rating: "4.9",
        slots: ["2:00 PM", "3:30 PM", "4:00 PM"],
        selected: "2:00 PM",
      },
    },
  },
  {
    icon: Clock,
    title: "Know Your Wait",
    description: "Real-time queue position and arrival time",
    step: "03",
    mockup: {
      type: "queue",
      content: {
        position: "#3",
        waitTime: "15 mins",
        status: "Dr. Smith is running on time",
        currentToken: "#1",
      },
    },
  },
  {
    icon: CreditCard,
    title: "Instant Receipt",
    description: "Secure payment with immediate confirmation",
    step: "04",
    mockup: {
      type: "receipt",
      content: {
        amount: "₹500",
        doctor: "Dr. Sarah Smith",
        date: "Today, 2:00 PM",
        status: "Paid",
        receiptId: "CQ-2024-001",
      },
    },
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.getAttribute("data-index") || "0")
            setVisibleSteps((prev) => [...prev, index])
          }
        })
      },
      { threshold: 0.1 },
    )

    const section = document.getElementById("how-it-works")
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  const renderMockup = (step: (typeof steps)[0], index: number) => {
    switch (step.mockup.type) {
      case "whatsapp":
        return (
          <div className="bg-gray-50 rounded-t-3xl p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[#1BBA8B] rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800">CatchQ Clinic</span>
            </div>
            <div className="bg-white rounded-2xl p-4 text-gray-900 space-y-3 max-h-64 overflow-y-auto border border-gray-100">
              {step.mockup.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                      msg.type === "user"
                        ? "bg-[#1BBA8B] text-white"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "app": {
        const content = step.mockup.content
        return (
          <div className="bg-gray-50 rounded-t-3xl p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Select Doctor</span>
              <div className="text-xs text-gray-500">2:30 PM</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-gray-900 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                  DS
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{content.doctor}</div>
                  <div className="text-sm text-gray-600">{content.specialty}</div>
                  <div className="flex items-center text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-gray-700">{content.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Available Slots</div>
                {content.slots.map((slot, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm border ${
                      slot === content.selected
                        ? "bg-[#1BBA8B] text-white border-[#1BBA8B]"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case "queue":
        return (
          <div className="bg-gray-50 rounded-t-3xl p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Queue Status</span>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-gray-900 border border-gray-100">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-[#1BBA8B] mb-1">{step.mockup.content.position}</div>
                <div className="text-sm text-gray-600">Your Position</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600">Estimated Wait</span>
                  <span className="font-semibold text-gray-900">{step.mockup.content.waitTime}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600">Now Serving</span>
                  <span className="font-semibold text-[#1BBA8B]">{step.mockup.content.currentToken}</span>
                </div>
                <div className="text-xs text-gray-500 text-center p-2">{step.mockup.content.status}</div>
              </div>
            </div>
          </div>
        )

      case "receipt":
        return (
          <div className="bg-gray-50 rounded-t-3xl p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Payment Receipt</span>
              <div className="text-xs text-gray-500">Confirmed</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-gray-900 border border-gray-100">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-[#1BBA8B] mb-1">{step.mockup.content.amount}</div>
                <div className="text-sm text-gray-600">Payment Successful</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600">Doctor</span>
                  <span className="font-medium text-gray-900">{step.mockup.content.doctor}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium text-gray-900">{step.mockup.content.date}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600">Receipt ID</span>
                  <span className="font-medium text-gray-900">{step.mockup.content.receiptId}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-[#1BBA8B]">{step.mockup.content.status}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-2 mb-6 border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-[#1BBA8B] rounded-full"></div>
            <span className="text-[#1BBA8B] font-semibold text-sm uppercase tracking-wide">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            From Message to <span className="text-[#1BBA8B]">Appointment</span> in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how patients experience seamless booking through our clean, intuitive interface.
          </p>
        </div>

        {/* Mobile Demo Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection arrows for desktop */}
            <div className="hidden lg:flex absolute top-1/2 left-0 right-0 items-center justify-between px-32 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <ArrowRight key={i} className="w-6 h-6 text-gray-300" />
              ))}
            </div>

            {steps.map((step, index) => (
              <div
                key={index}
                data-index={index}
                className={`relative transition-all duration-700 ease-out ${
                  visibleSteps.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step Number */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-[#1BBA8B] text-[#1BBA8B] rounded-full font-bold text-lg mb-2 shadow-sm">
                    {step.step}
                  </div>
                </div>

                {/* Phone Mockup */}
                <div className="relative mx-auto max-w-xs">
                  <div className="bg-gray-800 rounded-3xl p-2 shadow-2xl">
                    {/* Phone Frame */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                      {/* Status Bar */}
                      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-xs border-b border-gray-100">
                        <span className="font-medium text-gray-800">9:41</span>
                        <div className="flex space-x-1">
                          <div className="w-4 h-2 bg-[#1BBA8B] rounded-sm"></div>
                          <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                          <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                        </div>
                      </div>

                      {/* App Content */}
                      <div className="h-96">{renderMockup(step, index)}</div>
                    </div>
                  </div>

                  {/* Subtle shadow */}
                  <div className="absolute inset-0 bg-gray-200/20 rounded-3xl blur-xl scale-105 opacity-50 -z-10"></div>
                </div>

                {/* Step Info */}
                <div className="text-center mt-6 space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
