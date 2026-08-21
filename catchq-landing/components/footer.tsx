import { MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="CatchQ" width={40} height={40} className="h-10 w-auto" />
              <div className="text-2xl font-bold">CatchQ</div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Revolutionizing clinic management with WhatsApp-based patient engagement and appointment booking.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#1BBA8B] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1BBA8B] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1BBA8B] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1BBA8B] transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Product</h3>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Mobile App
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Support</h3>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Training
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Legal</h3>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1BBA8B] transition-colors">
                  HIPAA Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 CatchQ. All rights reserved.</p>
            <div className="flex items-center space-x-2 text-gray-400 mt-4 md:mt-0">
              <MapPin className="w-4 h-4" />
              <span>Made in India with ❤️</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
