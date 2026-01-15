import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Riksa Uji',
  description: 'Sistem Manajemen Riksa Uji - Aircraft Inspection Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
