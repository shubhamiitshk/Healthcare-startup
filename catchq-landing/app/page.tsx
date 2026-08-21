"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { DashboardShowcase } from "@/components/dashboard-showcase"
import { Benefits } from "@/components/benefits"
import { ProductShowcase } from "@/components/product-showcase"
import { Contact } from "@/components/contact"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { MobileApps } from "@/components/mobile-apps"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-in {
          animation-duration: 0.6s;
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Header />
      <Hero />
      <HowItWorks />
      <DashboardShowcase />
      <Features />
      <Benefits />
      <MobileApps />
      <ProductShowcase />
      <CTA />
      <Contact />
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
