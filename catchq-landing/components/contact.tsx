import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin } from "lucide-react"

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get in Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to transform your clinic? Contact us for a free demo or to learn more about CatchQ.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#1BBA8B]/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[#1BBA8B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600 text-lg">+91 98765 43210</p>
                  <p className="text-gray-500">Mon-Fri 9AM-6PM IST</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#164772]/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-8 h-8 text-[#164772]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-lg">hello@catchq.in</p>
                  <p className="text-gray-500">We&apos;ll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Address</h3>
                  <p className="text-gray-600 text-lg">
                    123 Healthcare Street
                    <br />
                    Tech City, TC 560001
                    <br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Send us a Message</h3>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                  <Input placeholder="Dr. John Doe" className="h-12 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name *</label>
                  <Input placeholder="Your Clinic Name" className="h-12 border-gray-300" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <Input placeholder="doctor@clinic.com" type="email" className="h-12 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <Input placeholder="+91 98765 43210" type="tel" className="h-12 border-gray-300" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <Textarea
                  placeholder="Tell us about your clinic and how we can help you..."
                  className="min-h-[120px] border-gray-300"
                />
              </div>

              <Button className="w-full h-12 bg-[#1BBA8B] hover:bg-[#164772] text-lg">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
