import '@/assets/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // html/body are rendered by [language]/layout.tsx to support per-locale lang attribute
  return children as React.ReactElement
}
