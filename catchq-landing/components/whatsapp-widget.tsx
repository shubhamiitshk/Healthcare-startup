"use client"

import { MessageCircle } from "lucide-react"
import { useState } from "react"

export function WhatsAppWidget() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <a
        href="https://wa.me/919876543210?text=Hi! I'd like to know more about CatchQ"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 ease-out flex items-center justify-center group hover:scale-110 transform"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ animationDuration: "2s" }}
      >
        <MessageCircle
          className={`w-8 h-8 transition-all duration-300 ease-out ${isHovered ? "scale-110 rotate-6" : ""}`}
        />
        <span className="sr-only">Chat on WhatsApp</span>

        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
      </a>
    </div>
  )
}
