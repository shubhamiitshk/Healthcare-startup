"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

const navItems = [
  { name: "Home", href: "#home" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Features", href: "#features" },
  { name: "Benefits", href: "#benefits" },
  { name: "Contact", href: "#contact" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.href.substring(1))
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1))
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => scrollToSection("#home")}>
            <Image
              src="/logo.png"
              alt="CatchQ"
              width={40}
              height={40}
              className="h-10 w-auto mr-3 transition-transform duration-300 group-hover:scale-110"
            />
            <div className="text-2xl font-bold text-[#164772] transition-colors duration-300 group-hover:text-[#1BBA8B]">
              CatchQ
            </div>
          </div>

          <nav className="hidden lg:flex space-x-10">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={`text-gray-600 hover:text-[#1BBA8B] transition-all duration-300 font-medium relative transform hover:scale-105 ${
                  activeSection === item.href.substring(1) ? "text-[#1BBA8B]" : ""
                }`}
              >
                {item.name}
                {activeSection === item.href.substring(1) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#1BBA8B] rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <a
              href={process.env.NEXT_PUBLIC_ADMIN_URL ? `${process.env.NEXT_PUBLIC_ADMIN_URL}/login` : "http://localhost:3002/login"}
              className="text-[#164772] hover:text-[#1BBA8B] font-medium px-4 py-2 transition-colors"
            >
              Sign In
            </a>
            <a
              href={process.env.NEXT_PUBLIC_REGISTER_URL || "http://localhost:3003"}
            >
              <Button className="bg-[#1BBA8B] hover:bg-[#0ea574] px-6 py-2.5 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-full">
                Get Started
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </a>
          </div>

          <button
            className="lg:hidden p-2 transition-transform duration-300 hover:scale-110"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 bg-white animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col space-y-6">
              {navItems.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-left text-lg text-gray-600 hover:text-[#1BBA8B] transition-all duration-300 font-medium py-2 transform hover:translate-x-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.name}
                </button>
              ))}
              <div className="flex flex-col space-y-4 pt-6">
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL ? `${process.env.NEXT_PUBLIC_ADMIN_URL}/login` : "http://localhost:3002/login"}
                  className="text-center text-[#164772] font-medium py-2"
                >
                  Sign In
                </a>
                <a
                  href={process.env.NEXT_PUBLIC_REGISTER_URL || "http://localhost:3003"}
                  className="w-full"
                >
                  <Button className="w-full bg-[#1BBA8B] hover:bg-[#0ea574] text-lg py-3 transition-all duration-300 hover:scale-105 rounded-full">
                    Get Started
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
