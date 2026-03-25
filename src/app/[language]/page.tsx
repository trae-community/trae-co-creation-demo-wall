'use client'

import { useState, useEffect, useCallback } from "react";
import { Work } from "@/lib/types";
import { WorkCard } from "@/components/work/work-card";
import { CityFilter, FilterState } from "@/components/work/city-filter";
import { Search, Clock, ThumbsUp, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { useWorksStore } from '@/store/works-store';
import { cn } from "@/lib/utils";
import { HeroBanner } from "@/components/home/hero-banner";

export default function Page() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [filters, setFilters] = useState<FilterState>({
    cities: [],
    categories: [],
    tags: [],
    countries: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'time' | 'likes' | 'views'>('time');
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const { listCache, setListCache } = useWorksStore();

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search: searchQuery,
      sort: sortBy === 'time' ? 'newest' : sortBy,
      lang: locale,
    });

    if (filters.cities.length > 0) params.append('city', filters.cities.join(','));
    if (filters.countries.length > 0) params.append('country', filters.countries.join(','));
    if (filters.categories.length > 0) params.append('category', filters.categories.join(','));
    if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

    const cacheKey = params.toString();

    const cached = listCache.get(cacheKey);
    if (cached) {
      setWorks(cached.items);
      setTotalItems(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/works?${cacheKey}`);
      const data = await response.json();
      const items = data.items || [];
      const total = data.total || 0;
      const pages = Math.max(1, data.totalPages || 1);
      setWorks(items);
      setTotalItems(total);
      setTotalPages(pages);
      setListCache(cacheKey, { items, total, totalPages: pages });
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, locale, page, pageSize, listCache, setListCache]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery, sortBy, locale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

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

          {/* Sort tabs — fixed right */}
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
          </div>
        </div>

        {/* Row 2: Filter pills */}
        <CityFilter filters={filters} onFilterChange={setFilters} />
      </div>

      {/* ── WORK GRID ── */}
      {loading && works.length === 0 ? (
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
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300", loading && "opacity-60")}>
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
              setFilters({ cities: [], categories: [], tags: [], countries: [] });
              setSearchQuery("");
            }}
            className="text-green-500 text-sm font-medium hover:underline"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {!loading && totalItems > 0 && (
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
