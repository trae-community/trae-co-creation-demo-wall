'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkCard } from "@/components/work/work-card";
import { PosterImage } from "@/components/work/poster-image";
import { CityFilter, FilterState } from "@/components/work/city-filter";
import { Search, Clock, ThumbsUp, Eye, ChevronLeft, ChevronRight, SearchX, X, ImageIcon, LayoutGrid } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { HeroBanner } from "@/components/common/hero-banner";
import { useWorks } from "@/lib/use-works";
import { DatePicker } from "@/components/ui/date-picker";
import { Link } from '@/lib/language/navigation';

export default function Page() {
  const t = useTranslations('Home');
  const tNav = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    cities: searchParams.get('cities')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    countries: searchParams.get('countries')?.split(',').filter(Boolean) || [],
    honors: searchParams.get('honors')?.split(',').filter(Boolean) || [],
    auditStatuses: [],
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || "");
  const [sortBy, setSortBy] = useState<'time' | 'likes' | 'views'>((searchParams.get('sort') as any) || 'time');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortTransitioning, setSortTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'works' | 'posters'>('works');
  const pageSize = 12;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 翻页时滚回顶部
  const prevPageRef = useRef(page);
  useEffect(() => {
    if (page !== prevPageRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevPageRef.current = page;
    }
  }, [page]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setPage(1);
  }, [filters, debouncedSearch, sortBy, selectedDate]);

  // Sort change transition
  useEffect(() => {
    setSortTransitioning(true);
    const timer = setTimeout(() => setSortTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [sortBy]);

  // 同步状态到 URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.cities.length) params.set('cities', filters.cities.join(','));
    if (filters.categories.length) params.set('categories', filters.categories.join(','));
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.countries.length) params.set('countries', filters.countries.join(','));
    if (filters.honors.length) params.set('honors', filters.honors.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy !== 'time') params.set('sort', sortBy);
    if (selectedDate) params.set('date', selectedDate);
    if (page > 1) params.set('page', page.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/${locale}${newUrl}`, { scroll: false });
  }, [filters, debouncedSearch, sortBy, selectedDate, page, router, locale]);

  const { data, isLoading } = useWorks({
    page,
    pageSize,
    search: debouncedSearch,
    sort: sortBy === 'time' ? 'newest' : sortBy,
    lang: locale,
    city: filters.cities.join(','),
    country: filters.countries.join(','),
    category: filters.categories.join(','),
    tags: filters.tags.join(','),
    date: selectedDate || undefined,
    honor: filters.honors.join(','),
  });

  const works = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Pagination page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, null, totalPages];
    if (page >= totalPages - 2) return [1, null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, null, page - 1, page, page + 1, null, totalPages];
  };

  // Mobile: show fewer page numbers
  const getMobilePageNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page === 1) return [1, 2, null, totalPages];
    if (page === totalPages) return [1, null, totalPages - 1, totalPages];
    return [1, null, page, null, totalPages];
  };

  const sortOptions = [
    { key: 'time' as const, icon: <Clock className="w-3 h-3" />, label: t('sortNewest') },
    { key: 'likes' as const, icon: <ThumbsUp className="w-3 h-3" />, label: t('sortLikes') },
    { key: 'views' as const, icon: <Eye className="w-3 h-3" />, label: t('sortViews') },
  ];

  return (
    <>
      {/* Banner 移出 space-y 包裹层，以便抵住顶栏并铺满视口宽度 */}
      <HeroBanner />
      <div className="mt-8 space-y-8">
        {/* ── 作品/海报 Tab 切换 ── */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center rounded-xl border border-white/10 p-1 gap-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <button
              onClick={() => setActiveTab('works')}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all border",
                activeTab === 'works'
                  ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "text-zinc-500 border-transparent hover:text-white hover:bg-white/5"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {tNav('home')}
            </button>
            <button
              onClick={() => setActiveTab('posters')}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all border",
                activeTab === 'posters'
                  ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "text-zinc-500 border-transparent hover:text-white hover:bg-white/5"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              {tNav('posters')}
            </button>
          </div>
        </div>

        {activeTab === 'works' ? (
        <>
        {/* ── FILTER TOOLBAR ── */}
      {/* scroll-mt 预留 sticky 顶栏高度，避免跳转后筛选栏被遮挡 */}
      <div id="projects" className="scroll-mt-20 space-y-4">
        {/* Row 1: Search (left) + Sort (right) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search — takes up remaining space */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-green-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border border-input focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/35 transition-all bg-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort tabs + Date picker — fixed right */}
          <div
            className="flex items-center rounded-xl border border-white/10 p-1 gap-0.5 shrink-0"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {sortOptions.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all border",
                  sortBy === key
                    ? "bg-green-500/15 text-green-400 border-green-500/25"
                    : "text-zinc-500 border-transparent hover:text-white hover:bg-white/5"
                )}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Date picker — 自定义日历弹窗，与 UI 风格一致 */}
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder={t('dateLabel')}
            />
          </div>
        </div>

        {/* Row 2: Filter pills — 与作品管理页/个人主页统一交互 */}
        <CityFilter
          filters={filters}
          onFilterChange={setFilters}
          showReset
          searchTerm={searchQuery}
          onReset={() => setSearchQuery('')}
        />
      </div>

      {/* ── WORK GRID ── */}
      {isLoading && works.length === 0 ? (
        /* Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/5" style={{ background: '#111318' }}>
              <div className="animate-pulse bg-white/5" style={{ aspectRatio: '4/3' }} />
              <div className="p-5 space-y-3">
                <div className="animate-pulse h-4 bg-white/5 rounded-md w-3/4" />
                <div className="animate-pulse h-3 bg-white/5 rounded-md w-full" />
                <div className="animate-pulse h-3 bg-white/5 rounded-md w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : works.length > 0 ? (
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-200",
          isLoading && "opacity-60",
          sortTransitioning && "opacity-40 scale-[0.98]"
        )}>
          {works.map((work, index) => (
            <div
              key={work.id}
              style={{ animation: `cardFadeUp 0.4s ease-out ${index * 50}ms both` }}
            >
              <WorkCard key={work.id} work={work} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <SearchX className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 text-sm mb-4">{t('noResults')}</p>
          <button
            onClick={() => {
              setFilters({ cities: [], categories: [], tags: [], countries: [], honors: [], auditStatuses: [] });
              setSearchQuery("");
              setSelectedDate("");
            }}
            className="px-4 py-2 rounded-md text-sm font-medium text-green-400 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {!isLoading && totalItems > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-zinc-500">
            {t('resultCount') || '共'}{' '}
            <span className="text-zinc-300 font-medium">{totalItems}</span>{' '}
            {t('resultCountUnit') || '个作品'}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 border border-white/10 hover:border-white/20 hover:text-white transition-all disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                aria-label={t('prevPage')}
                title={t('prevPage')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Desktop pagination */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((p, i) =>
                  p === null ? (
                    <span key={`ellipsis-${i}`} className="text-zinc-700 px-1 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                        p === page
                          ? "text-black font-bold"
                          : "text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white"
                      )}
                      style={p === page
                        ? { background: '#32F08C', color: '#000' }
                        : { background: 'rgba(255,255,255,0.04)' }
                      }
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Mobile pagination */}
              <div className="flex sm:hidden items-center gap-1">
                {getMobilePageNumbers().map((p, i) =>
                  p === null ? (
                    <span key={`ellipsis-${i}`} className="text-zinc-700 px-1 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                        p === page
                          ? "text-black font-bold"
                          : "text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white"
                      )}
                      style={p === page
                        ? { background: '#32F08C', color: '#000' }
                        : { background: 'rgba(255,255,255,0.04)' }
                      }
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 border border-white/10 hover:border-white/20 hover:text-white transition-all disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                aria-label={t('nextPage')}
                title={t('nextPage')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

        </>
        ) : (
          /* ── 海报展示区 ── */
          <PostersTab />
        )}

      </div>
    </>
  );
}

/* 海报 Tab 内容组件 */
function PostersTab() {
  const tPosters = useTranslations('Posters');
  const [posters, setPosters] = useState<{id: string; nickname: string; description: string | null; imageUrl: string; demoUrl: string; tags: string[] | null; createdAt: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posters?page=1&pageSize=8')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setPosters(data.items || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
            <div className="animate-pulse bg-muted" style={{ aspectRatio: '283.46/425.2' }} />
            <div className="p-4 space-y-2">
              <div className="animate-pulse h-4 bg-muted rounded-md w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-card">
        <p className="text-muted-foreground text-sm">{tPosters('noPosters')}</p>
      </div>
    );
  }

  return (
    <div>
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
                qrText={tPosters('scanToExperience')}
                fallbackTitle={poster.nickname}
                anonymousLabel={poster.nickname}
                className="group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
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
    </div>
  );
}
