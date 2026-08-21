"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Rocket } from "lucide-react"
import { useEffect, useState } from "react"

export function CTA() {
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

    const section = document.getElementById("cta-section")
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="cta-section" className="py-24 bg-gradient-to-br from-[#164772] to-[#1BBA8B] relative overflow-hidden">
      {/* Animated background elements */}

      <div className="container mx-auto px-6 lg:px-8 relative">
        <div
          className={`max-w-4xl mx-auto text-center text-white space-y-12 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <Rocket className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Clinic?</h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Join 500+ healthcare professionals who have revolutionized their practice with CatchQ. Start your free
              trial today and see the difference in just 24 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#164772] hover:bg-gray-100 text-lg px-10 py-4 h-14 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl transform"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-4 h-14 border-2 border-white text-white hover:bg-white hover:text-[#164772] bg-transparent transition-all duration-300 hover:scale-110 hover:shadow-2xl transform"
            >
              Book a Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="text-center transform hover:scale-105 transition-all duration-300 ease-out">
              <div className="text-3xl font-bold mb-2">14 Days</div>
              <div className="opacity-90">Free Trial</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300 ease-out">
              <div className="text-3xl font-bold mb-2" style={{ animationDelay: "0.2s" }}>
                24 Hours
              </div>
              <div className="opacity-90">Setup Time</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-all duration-300 ease-out">
              <div className="text-3xl font-bold mb-2" style={{ animationDelay: "0.4s" }}>
                24/7
              </div>
              <div className="opacity-90">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
