"use client"

import Layout from "@/components/layout"
import { AppointmentTable } from "@/components/appointment-table"

export default function AppointmentsPage() {
  return (
    <Layout>
      <style jsx global>{`
        @media (min-width: 768px) {
          .appointments-sidebar {
            width: 12rem !important;
          }
        }
      `}</style>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Appointments</h1>
        <p className="mb-6 text-gray-600">View and manage all patient appointments here.</p>
        <AppointmentTable />
      </div>
    </Layout>
  )
}
