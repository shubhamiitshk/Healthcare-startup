import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CatchQ - Smart Clinic Queue Management',
  description: 'Streamline your clinic operations with CatchQ - the smart queue management system for modern healthcare.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
