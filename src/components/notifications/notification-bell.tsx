'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, usePathname } from '@/lib/language/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function NotificationBell() {
  const t = useTranslations('Notifications');
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    fetch('/api/notifications/unread-count')
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setCount(Number(data.count) || 0))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onUpdated = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('notifications-updated', onUpdated);
    const interval = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('notifications-updated', onUpdated);
      clearInterval(interval);
    };
  }, [refresh, pathname]);

  const display = count > 99 ? '99+' : String(count);

  return (
    <Link
      href="/notifications"
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300',
        pathname === '/notifications'
          ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-lg shadow-green-500/20'
          : 'text-zinc-400 border-white/10 hover:text-white hover:bg-white/5'
      )}
      aria-label={t('bellAria', { count })}
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#32F08C] to-[#17D479] text-black text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(50,240,140,0.4)]"
        >
          {display}
        </span>
      )}
    </Link>
  );
}
