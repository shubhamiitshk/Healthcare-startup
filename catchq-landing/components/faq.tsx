"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "How quickly can we set up CatchQ for our clinic?",
    answer:
      "Setup is incredibly fast! Most clinics are up and running within 24 hours. Our team handles the technical setup, and you just need to provide basic clinic information and doctor schedules.",
  },
  {
    question: "Do patients need to download any app?",
    answer:
      "Patients have two options: they can use WhatsApp (no download needed) or download our dedicated mobile app for enhanced features like appointment history, digital receipts, and push notifications.",
  },
  {
    question: "How do digital receipts work?",
    answer:
      "After every payment, patients automatically receive digital receipts via WhatsApp and the mobile app. They can download PDFs, share via email, and access their complete payment history anytime.",
  },
  {
    question: "What about follow-up reminders?",
    answer:
      "Our system automatically sends follow-up reminders via WhatsApp and app notifications based on your clinic's protocols. You can customize reminder schedules for different types of treatments.",
  },
  {
    question: "Is the mobile app available for both Android and iOS?",
    answer:
      "Yes! Our patient mobile app is available on both Google Play Store and Apple App Store. It's free to download and works seamlessly with our WhatsApp integration.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support all major payment gateways including UPI, credit/debit cards, net banking, and digital wallets. Payment links are sent via both WhatsApp and the mobile app.",
  },
  {
    question: "How secure is patient data?",
    answer:
      "We follow strict healthcare data protection standards and are fully compliant with relevant regulations. All patient data is encrypted, and we maintain HIPAA-level security standards.",
  },
  {
    question: "Can patients view their appointment history?",
    answer:
      "Yes! Through the mobile app, patients can view their complete appointment history, past digital receipts, doctor notes (if shared), and upcoming appointments all in one place.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Got questions? We&apos;ve got answers. If you don&apos;t find what you&apos;re looking for, feel free to contact our
            support team.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
