export function TrustedBy() {
  const clinics = [
    "HealthCare Plus",
    "City Medical Center",
    "Family Wellness Clinic",
    "Advanced Diagnostics",
    "Pediatric Care Center",
    "Dental Excellence",
    "Cardiology Specialists",
    "Women's Health Clinic",
  ]

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-lg font-semibold text-gray-600 mb-8">Trusted by 500+ Healthcare Providers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center">
            {clinics.map((clinic, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-[#1BBA8B]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-[#164772] font-bold text-sm">{clinic.charAt(0)}</span>
                </div>
                <div className="text-xs text-gray-600 font-medium">{clinic}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
