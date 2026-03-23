import type { Metadata } from 'next';
import { Inter, Aleo, Roboto_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { SiteLayout } from '@/components/layout/site-layout';

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Aleo({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: 'TRAE DEMO WALL',
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
          colorPrimary: "rgb(50, 240, 140)",
          colorBackground: "rgb(34, 36, 39)",
          colorInputBackground: "rgb(70, 71, 78)",
          colorText: "rgb(245, 249, 254)",
          colorTextSecondary: "rgb(245, 249, 254)",
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
