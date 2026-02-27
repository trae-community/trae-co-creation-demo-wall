import './globals.css'
import type { Metadata } from 'next'
import { Layout } from '@/components/Layout'

export const metadata: Metadata = {
  title: 'TRAE DEMO WALL',
  description: 'Showcasing every real completed work',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
