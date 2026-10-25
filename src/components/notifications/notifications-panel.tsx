'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Bell, CheckCheck, ThumbsUp, FileCheck, FileX, ImageIcon } from 'lucide-react';
import { Link } from '@/lib/language/navigation';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/lib/user-notifications';
import { RemoteImage } from '@/components/common/remote-image';

type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

function formatRelativeTime(iso: string, locale: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return locale.startsWith('zh') ? '刚刚' : locale.startsWith('ja') ? 'たった今' : 'Just now';
  if (minutes < 60) return locale.startsWith('zh') ? `${minutes} 分钟前` : locale.startsWith('ja') ? `${minutes}分前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale.startsWith('zh') ? `${hours} 小时前` : locale.startsWith('ja') ? `${hours}時間前` : `${hours}h ago`;
  return date.toLocaleDateString(locale);
}

function NotificationIcon({ type }: { type: string }) {
  if (type === NotificationType.WORK_LIKED) {
    return <ThumbsUp className="w-4 h-4 text-green-500" />;
  }
  if (type === NotificationType.WORK_AUDIT_APPROVED || type === NotificationType.POSTER_AUDIT_APPROVED) {
    return <FileCheck className="w-4 h-4 text-green-500" />;
  }
  if (type === NotificationType.WORK_AUDIT_REJECTED || type === NotificationType.POSTER_AUDIT_REJECTED) {
    return <FileX className="w-4 h-4 text-amber-500" />;
  }
  return <Bell className="w-4 h-4 text-muted-foreground" />;
}

export function NotificationsPanel() {
  const t = useTranslations('Notifications');
  const locale = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?page=${pageNum}&pageSize=20`
      );
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.page ?? pageNum);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item
      )
    );
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        }))
      );
      window.dispatchEvent(new Event('notifications-updated'));
    } finally {
      setMarkingAll(false);
    }
  };

  const messageFor = (item: NotificationItem) => {
    const p = item.payload;
    const workTitle = String(p.workTitle ?? '');
    const posterNickname = String(p.posterNickname ?? '');
    const actor = String(p.actorUsername ?? '');
    const reason = p.auditReason ? String(p.auditReason) : '';

    switch (item.type) {
      case NotificationType.WORK_AUDIT_APPROVED:
        return t('workApproved', { title: workTitle });
      case NotificationType.WORK_AUDIT_REJECTED:
        return reason
          ? t('workRejectedWithReason', { title: workTitle, reason })
          : t('workRejected', { title: workTitle });
      case NotificationType.POSTER_AUDIT_APPROVED:
        return t('posterApproved', { name: posterNickname });
      case NotificationType.POSTER_AUDIT_REJECTED:
        return t('posterRejected', { name: posterNickname });
      case NotificationType.WORK_LIKED:
        return t('workLiked', { user: actor, title: workTitle });
      default:
        return t('unknown');
    }
  };

  const hrefFor = (item: NotificationItem) => {
    const p = item.payload;
    if (p.workId) return `/works/${p.workId}`;
    if (p.posterId) return '/profile';
    return '/notifications';
  };

  const hasUnread = items.some((item) => !item.readAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-border bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            {t('markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const unread = !item.readAt;
            const actorAvatar = item.payload.actorAvatarUrl as string | null | undefined;
            return (
              <li key={item.id}>
                <Link
                  href={hrefFor(item)}
                  onClick={() => {
                    if (unread) markRead(item.id);
                  }}
                  className={cn(
                    'flex gap-3 p-4 rounded-xl border transition-all',
                    unread
                      ? 'border-green-500/25 bg-green-500/5 hover:bg-green-500/10'
                      : 'border-border bg-card hover:bg-muted/40'
                  )}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {item.type === NotificationType.WORK_LIKED && actorAvatar ? (
                      <RemoteImage
                        src={actorAvatar}
                        alt=""
                        width={40}
                        height={40}
                        sizes="40px"
                        className="w-full h-full object-cover"
                      />
                    ) : item.type.includes('poster') ? (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <NotificationIcon type={item.type} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {messageFor(item)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(item.createdAt, locale)}
                    </p>
                  </div>
                  {unread && (
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40"
          >
            {t('prev')}
          </button>
          <span className="text-sm text-muted-foreground self-center">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
