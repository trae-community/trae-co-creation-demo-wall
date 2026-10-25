'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/language/navigation';
import { RemoteImage } from '@/components/common/remote-image';

type LikerUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

type LikeItem = {
  id: string;
  likedAt: string | null;
  user: LikerUser;
};

interface WorkLikersSectionProps {
  workId: string;
  enabled: boolean;
  className?: string;
}

export function WorkLikersSection({ workId, enabled, className }: WorkLikersSectionProps) {
  const t = useTranslations('Work');
  const [items, setItems] = useState<LikeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !workId) return;
    setLoading(true);
    fetch(`/api/works/${workId}/likes?pageSize=16`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workId, enabled]);

  if (!enabled) return null;

  return (
    <section className={cn('rounded-2xl border border-border bg-card/50 p-6 mt-8', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {t('likersTitle')}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('likersSubtitle', { count: total })}
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">{t('likersEmpty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/user/${item.user.id}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-muted/40',
                  'text-sm text-foreground hover:border-green-500/40 hover:bg-green-500/5 transition-colors'
                )}
                title={item.user.username}
              >
              <span className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border">
                {item.user.avatarUrl ? (
                  <RemoteImage
                    src={item.user.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    sizes="28px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center">
                    <UserRound className="w-4 h-4 text-muted-foreground" />
                  </span>
                )}
              </span>
              <span className="max-w-[120px] truncate">{item.user.username}</span>
              </Link>
            </li>
          ))}
          {total > items.length && (
            <li className="flex items-center px-3 py-2 text-sm text-muted-foreground">
              {t('likersMore', { count: total - items.length })}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
