'use client'

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { ChevronLeft, ChevronRight, SearchX, QrCode, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PosterImage } from '@/components/work/poster-image';

interface PosterItem {
  id: string;
  nickname: string;
  description: string | null;
  imageUrl: string;
  demoUrl: string;
  tags: string[] | null;
  createdAt: string;
}

export default function PostersPage() {
  const t = useTranslations('Posters');
  const locale = useLocale();

  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const fetchPosters = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/posters?page=${page}&pageSize=${pageSize}&sort=${sort}`);
        if (res.ok) {
          const data = await res.json();
          setPosters(data.items || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosters();
  }, [page, sort]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      {/* 排序控制 */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
          <button
            onClick={() => { setSort('newest'); setPage(1); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
              sort === 'newest' ? "bg-green-500 text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('sortNewest')}
          </button>
          <button
            onClick={() => { setSort('oldest'); setPage(1); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
              sort === 'oldest' ? "bg-green-500 text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="w-3.5 h-3.5" />
            {t('sortOldest')}
          </button>
        </div>
      </div>

      {/* 海报网格 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
              <div className="animate-pulse bg-muted" style={{ aspectRatio: '283.46/425.2' }} />
              <div className="p-4 space-y-2">
                <div className="animate-pulse h-4 bg-muted rounded-md w-2/3" />
                <div className="animate-pulse h-3 bg-muted rounded-md w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posters.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {posters.map((poster) => (
              <Link
                key={poster.id}
                href={`/posters/${poster.id}`}
                className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-green-500/40 hover:shadow-lg transition-all duration-300"
              >
                {/* 最终合成海报（封面 + 昵称 + 简介 + 二维码） */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '283.46/425.2' }}>
                  <PosterImage
                    nickname={poster.nickname}
                    description={poster.description}
                    imageUrl={poster.imageUrl}
                    demoUrl={poster.demoUrl}
                    qrText={t('scanToExperience')}
                    fallbackTitle={poster.nickname}
                    anonymousLabel={poster.nickname}
                    className="group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  {/* 悬浮遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-xs font-medium text-zinc-800">
                      <QrCode className="w-3.5 h-3.5" />
                      {t('scanToExperience')}
                    </span>
                  </div>
                </div>
                {/* 信息 */}
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1 group-hover:text-green-400 transition-colors [overflow-wrap:anywhere]">{poster.nickname}</h3>
                  {poster.description && (
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-4 [overflow-wrap:anywhere]">{poster.description}</p>
                  )}
                  {/* Tags — 与作品卡片统一样式 */}
                  {Array.isArray(poster.tags) && poster.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {poster.tags.slice(0, 3).map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="text-[10px] px-2 py-0.5 rounded-full border bg-white/5 text-zinc-600 border-white/10">{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* Footer: time — 与作品卡片统一样式 */}
                  <div className="flex min-w-0 items-center gap-1 pt-3.5 border-t border-white/5 mt-auto">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span className="text-[10px] text-zinc-600">
                      {new Date(poster.createdAt).getFullYear()}/{String(new Date(poster.createdAt).getMonth() + 1).padStart(2, '0')}/{String(new Date(poster.createdAt).getDate()).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground border border-border bg-muted hover:text-foreground transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground/50 px-1">…</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                        p === page
                          ? "bg-green-500 text-black font-bold"
                          : "text-muted-foreground border border-border bg-muted hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground border border-border bg-muted hover:text-foreground transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <SearchX className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{t('noPosters')}</p>
        </div>
      )}
    </div>
  );
}
