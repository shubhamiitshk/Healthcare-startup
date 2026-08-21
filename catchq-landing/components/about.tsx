import { Award, Users, TrendingUp, Shield } from "lucide-react"

export function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About CatchQ</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re revolutionizing healthcare management by making appointment booking as simple as sending a WhatsApp
            message. Our mission is to eliminate waiting room chaos and empower clinics with modern technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Our Story</h3>
            <p className="text-gray-600 leading-relaxed">
              Founded in 2023, CatchQ was born from the frustration of long waiting times and inefficient appointment
              systems in healthcare. We realized that patients shouldn&apos;t have to wait in crowded waiting rooms or make
              multiple phone calls just to book an appointment.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, we serve over 500 clinics and have helped 99,900+ patients book appointments seamlessly. Our
              platform has reduced no-shows by 60% and increased clinic revenue by an average of 40%.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1BBA8B]/10 rounded-xl p-6 text-center">
              <Award className="w-12 h-12 text-[#1BBA8B] mx-auto mb-4" />
              <div className="text-2xl font-bold text-[#164772]">500+</div>
              <div className="text-sm text-gray-600">Clinics Served</div>
            </div>
            <div className="bg-[#164772]/10 rounded-xl p-6 text-center">
              <Users className="w-12 h-12 text-[#164772] mx-auto mb-4" />
              <div className="text-2xl font-bold text-[#164772]">99,900+</div>
              <div className="text-sm text-gray-600">Happy Patients</div>
            </div>
            <div className="bg-green-100 rounded-xl p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-[#164772]">40%</div>
              <div className="text-sm text-gray-600">Revenue Increase</div>
            </div>
            <div className="bg-blue-100 rounded-xl p-6 text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-[#164772]">100%</div>
              <div className="text-sm text-gray-600">HIPAA Compliant</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#164772]/5 to-[#1BBA8B]/5 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              To make healthcare accessible and efficient by eliminating appointment booking friction and empowering
              both patients and healthcare providers with modern, intuitive technology.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
