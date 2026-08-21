"use client"

import { Button } from "@/components/ui/button"
import { Play, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section id="home" className="pt-32 pb-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div
            className={`space-y-8 transition-all duration-800 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 leading-tight">
              The effortless way to <span className="text-[#1BBA8B] font-medium">fill your</span>
              <br />
              <span className="text-[#1BBA8B] font-medium">clinic&apos;s schedule</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto font-normal">
              With CatchQ, patients book instantly through your website or WhatsApp and appointments sync automatically
              to your EHR. Smart reminders reduce no-shows. No double entries, no phone tag. Just effortless scheduling!
            </p>
          </div>

          <div
            className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-800 ease-out delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <Button
              size="lg"
              className="bg-[#1BBA8B] hover:bg-[#0ea574] text-white text-lg px-10 py-4 h-14 transition-all duration-300 hover:scale-105 hover:shadow-xl transform rounded-full font-medium"
            >
              Get Free Demo for Your Clinic
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-4 h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent transition-all duration-300 hover:scale-105 transform rounded-full font-medium"
            >
              <Play className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
