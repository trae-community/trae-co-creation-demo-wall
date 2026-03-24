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

  const featuredWorks = works.slice(0, 3);
  const topSignals = [
    { label: t('resultCountUnit') || '个作品', value: totalItems || works.length || 0 },
    { label: t('sortViews'), value: works.reduce((sum, item) => sum + item.views, 0) },
    { label: t('sortLikes'), value: works.reduce((sum, item) => sum + item.likes, 0) },
  ];

  return (
    <div className="space-y-10 lg:space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 hero-mesh noise-overlay shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
        <div className="relative grid gap-8 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.25fr_0.75fr] lg:px-14 lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-emerald-200/85">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(122,255,190,0.8)]" />
              {t('heroBadge') || '在这里，看见全国各地用户的 TRAE 创作作品'}
            </div>

            <div className="max-w-4xl space-y-5">
              <h1 className="font-display text-balance text-4xl font-extrabold leading-[0.92] text-white sm:text-5xl lg:text-7xl">
                {t('heroTitle')}{" "}
                <span className="bg-gradient-to-r from-[#7affbe] via-[#d8fff0] to-[#67b0ff] bg-clip-text text-transparent">
                  TRAE
                </span>
              </h1>
              <p className="max-w-2xl text-balance text-sm leading-7 text-slate-300/88 sm:text-base md:text-lg">
                {t('heroDescription')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200/20 bg-[linear-gradient(135deg,#7affbe,#4ed39f)] px-6 py-3 text-sm font-bold text-slate-950 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {t('submitWork')}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <a
                href="#projects"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                {t('browseWork')}
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {topSignals.map((signal) => (
                <div key={signal.label} className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-4 backdrop-blur-sm">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    {signal.label}
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">
                    {signal.value >= 1000 ? `${(signal.value / 1000).toFixed(1)}k` : signal.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:pt-10">
            <div className="panel-shell relative overflow-hidden rounded-[1.75rem] p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
              <p className="text-[13px] font-semibold tracking-wide text-slate-200">
                {t('featuredPanelTitle')}
              </p>
              <div className="mt-5 space-y-4">
                {featuredWorks.length > 0 ? featuredWorks.map((work, index) => (
                  <div key={work.id} className="flex items-start gap-4 rounded-2xl border border-white/6 bg-white/[0.025] p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-xs font-bold text-emerald-200">
                      0{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-white">{work.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{work.intro}</p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                    {loading ? t('loading') : t('noFeaturedYet')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="space-y-4">
        <div className="panel-shell rounded-[1.75rem] p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 lg:max-w-sm">
              <h2 className="font-display text-2xl font-bold text-white accent-line pb-3">
                {t('browseSectionTitle')}
              </h2>
              {!loading && (
                <p className="text-sm text-slate-400">
                  {t('resultCount') || '共'}{" "}
                  <span className="font-semibold text-white">{totalItems}</span>{" "}
                  {t('resultCountUnit') || '个作品'}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/10"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  {sortOptions.map(({ key, icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        sortBy === key
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                          : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      {icon}
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/10 p-3">
                <CityFilter filters={filters} onFilterChange={setFilters} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WORK GRID ── */}
      {loading && works.length === 0 ? (
        /* Skeleton */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel-shell overflow-hidden rounded-[1.6rem]">
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
        <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300", loading && "opacity-60")}>
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="panel-shell rounded-[1.75rem] border-dashed py-20 text-center">
          <div className="mb-4 text-4xl">◌</div>
          <p className="text-sm text-zinc-400 mb-3">{t('noResults')}</p>
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
        <div className="panel-shell flex items-center justify-between rounded-[1.5rem] px-4 py-3">
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-400">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)}</span>
            {' / '}<span className="text-zinc-400">{totalItems}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
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
                        ? { background: 'linear-gradient(to right, #22C55E, #16A34A)' }
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
                        ? { background: 'linear-gradient(to right, #22C55E, #16A34A)' }
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
