"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, UserCheck, Calendar, Settings, LogOut, Menu, X } from "lucide-react"
import { auth } from "@/firebase";

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
    } catch (e) {
      // Optionally handle error
    }
    localStorage.removeItem("clinicToken");
    localStorage.removeItem("clinicData");
    window.location.href = "/login"; // Use full reload to clear all state
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "My Queue",
      href: "/queue",
      icon: Users,
      current: pathname === "/queue",
    },
    {
      name: "Doctors",
      href: "/doctors",
      icon: UserCheck,
      current: pathname === "/doctors",
    },
    {
      name: "Appointments",
      href: "/appointments",
      icon: Calendar,
      current: pathname === "/appointments",
    },
    {
      name: "Billing",
      href: "/billing",
      icon: Calendar, // You can replace with a billing/invoice icon if available
      current: pathname === "/billing",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ]

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-[#164772] flex-col appointments-sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-[#1BBA8D] rounded-full"></div>
            </div>
            <span className="text-white text-xl font-semibold">CatchQ</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg cursor-pointer transition-colors ${
                    item.current ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-white">
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="w-64 bg-[#164772] h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#1BBA8D] rounded-full"></div>
                </div>
                <span className="text-white text-xl font-semibold">CatchQ</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg cursor-pointer transition-colors ${
                        item.current ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">{children}</div>
    </div>
  )
}
