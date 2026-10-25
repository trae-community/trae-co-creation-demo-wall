'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/lib/language/navigation';
import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const { status } = useSession();
  const t = useTranslations('Notifications');

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{t('loginRequired')}</p>
        <Link
          href="/sign-in"
          className="inline-flex px-5 py-2.5 rounded-md bg-gradient-to-r from-[#32F08C] to-[#17D479] text-black font-semibold"
        >
          {t('goSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-7 h-7 text-green-500" />
          {t('title')}
        </h1>
      </header>
      <section className="rounded-2xl border border-border bg-card p-6">
        <NotificationsPanel />
      </section>
    </div>
  );
}
