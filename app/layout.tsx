import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#22C55E",
          colorBackground: "#0A0A0C",
          colorInputBackground: "#1E1E22",
          colorText: "#FFFFFF",
          colorTextSecondary: "#A1A1AA",
        },
      }}
    >
      <html lang="zh">
        <body>
          <Layout>{children}</Layout>
        </body>
      </html>
    </ClerkProvider>
  )
}
