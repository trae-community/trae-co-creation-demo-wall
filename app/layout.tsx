import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TRAE DEMO WALL',
  description: 'Showcasing every real completed work',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
