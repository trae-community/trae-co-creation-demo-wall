import type { Metadata } from 'next';
import { IBM_Plex_Mono, Spline_Sans, Syne } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { SiteLayout } from '@/components/layout/site-layout';

const fontSans = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Syne({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: 'TRAE DEMO WALL',
  icons: {
    icon: '/trae.ico',
  },
  description: 'Showcasing every real completed work',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ language: string }>
}) {
  const { language } = await params;
  const messages = await getMessages();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "rgb(122, 255, 190)",
          colorBackground: "rgb(9, 12, 16)",
          colorInputBackground: "rgb(17, 22, 29)",
          colorText: "rgb(241, 247, 252)",
          colorTextSecondary: "rgb(149, 167, 183)",
        },
      }}
    >
      <html lang={language}>
        <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
          <NextIntlClientProvider messages={messages}>
            <SiteLayout>{children}</SiteLayout>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
