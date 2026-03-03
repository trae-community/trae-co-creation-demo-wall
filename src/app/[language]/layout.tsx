import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { SiteLayout } from '@/components/layout/site-layout';

export const metadata: Metadata = {
  title: 'TRAE DEMO WALL',
  description: 'Showcasing every real completed work',
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages();

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
      <NextIntlClientProvider messages={messages}>
        <SiteLayout>{children}</SiteLayout>
      </NextIntlClientProvider>
    </ClerkProvider>
  )
}
