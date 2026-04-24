'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkCard } from "@/components/work/work-card";
import { CityFilter, FilterState } from "@/components/work/city-filter";
import { Search, Clock, ThumbsUp, Eye, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { HeroBanner } from "@/components/home/hero-banner";
import { useWorks } from "@/hooks/use-works";

export default function Page() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    cities: searchParams.get('cities')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    countries: searchParams.get('countries')?.split(',').filter(Boolean) || [],
    honors: searchParams.get('honors')?.split(',').filter(Boolean) || [],
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || "");
  const [sortBy, setSortBy] = useState<'time' | 'likes' | 'views'>((searchParams.get('sort') as any) || 'time');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const pageSize = 12;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setPage(1);
  }, [filters, debouncedSearch, sortBy, selectedDate]);

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
    <div className="space-y-8">
      <HeroBanner />

      {/* ── FILTER TOOLBAR ── */}
      <div id="projects" className="space-y-4">
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 border border-white/10 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-500/35 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
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

            {/* Date picker — styled like sort buttons */}
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('date-filter-input') as HTMLInputElement | null;
                if (input) input.showPicker?.();
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all border",
                selectedDate
                  ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "text-zinc-500 border-transparent hover:text-white hover:bg-white/5"
              )}
            >
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">{selectedDate || t('dateLabel')}</span>
              <span className="sm:hidden">{selectedDate ? selectedDate.slice(5) : t('dateLabel')}</span>
              {selectedDate && (
                <span
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }}
                  className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
            <input
              id="date-filter-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {/* Row 2: Filter pills */}
        <CityFilter filters={filters} onFilterChange={setFilters} />
      </div>

      {/* ── WORK GRID ── */}
      {isLoading && works.length === 0 ? (
        /* Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/6" style={{ background: '#111318' }}>
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
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300", isLoading && "opacity-60")}>
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-zinc-400 text-sm mb-3">{t('noResults')}</p>
          <button
            onClick={() => {
              setFilters({ cities: [], categories: [], tags: [], countries: [], honors: [] });
              setSearchQuery("");
              setSelectedDate("");
            }}
            className="text-green-500 text-sm font-medium hover:underline"
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
    </div>
  );
}
