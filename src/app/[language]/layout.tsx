import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';
import { SiteLayout } from '@/components/layout/site-layout';
import { QueryProvider } from '@/components/common/query-provider';
import { auth } from '@/lib/auth-nextauth';
import { Toaster } from 'sonner';

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontChinese = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-chinese",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
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
  const session = await auth();

  return (
    <html lang={language}>
      <body className={`${fontSans.variable} ${fontChinese.variable} ${fontMono.variable} antialiased`}>
        <SessionProvider session={session} refetchOnWindowFocus={false} refetchInterval={0}>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <SiteLayout>{children}</SiteLayout>
            </NextIntlClientProvider>
          </QueryProvider>
        </SessionProvider>
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  )
}
