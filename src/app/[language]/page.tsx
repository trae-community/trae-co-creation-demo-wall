'use client'

import { useState, useEffect, useCallback } from "react";
import { Work } from "@/lib/types";
import { WorkCard } from "@/components/work/work-card";
import { CityFilter, FilterState } from "@/components/work/city-filter";
import { Search, Clock, ThumbsUp, Eye, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';

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

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
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
      
      const response = await fetch(`/api/works?${params.toString()}`);
      const data = await response.json();
      setWorks(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, locale, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery, sortBy, locale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <section className="relative rounded-3xl p-8 md:p-16 text-white overflow-hidden border border-white/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-background to-background z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.trae.ai/images/hero-bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay z-0"></div>

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            {t('heroTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-gray-300">TRAE</span>
          </h1>

          <div className="mb-10 max-w-xl">
            <p className="text-xl md:text-2xl font-light text-gray-300">
              {t('heroSubtitle1')} <span className="font-bold text-white">{t('heroSubtitleTRAE')}</span>. {t('heroSubtitle2')} <span className="font-bold text-white">{t('heroSubtitleFriends')}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/submit"
              className="px-8 py-4 rounded-full font-bold bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center gap-2 group/btn"
            >
              {t('submitWork')}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <a
              href="#projects"
              className="px-8 py-4 rounded-full font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
            >
              {t('browseWork')}
            </a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      </section>

      {/* Filter & Search */}
      <div id="projects" className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:flex-1 md:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500 group-focus-within:text-[#22C55E] transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-200 placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-[#22C55E]/50 focus:border-[#22C55E]/50 text-sm transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setSortBy('time')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                sortBy === 'time'
                  ? 'bg-[#22C55E] text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t('sortNewest')}</span>
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                sortBy === 'likes'
                  ? 'bg-[#22C55E] text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{t('sortLikes')}</span>
            </button>
            <button
              onClick={() => setSortBy('views')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                sortBy === 'views'
                  ? 'bg-[#22C55E] text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{t('sortViews')}</span>
            </button>
          </div>
        </div>

        <CityFilter filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Project Grid */}
      {loading && works.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#22C55E] animate-spin" />
        </div>
      ) : works.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10 backdrop-blur-sm">
          <p className="text-gray-400 text-lg">{t('noResults')}</p>
          <button
            onClick={() => {
              setFilters({
                cities: [],
                categories: [],
                tags: [],
                countries: [],
              });
              setSearchQuery("");
            }}
            className="text-primary font-medium mt-2 hover:underline"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {works.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8">
          <div className="text-sm text-gray-400">
            {t('paginationInfo', { start: startIndex, end: endIndex, total: totalItems })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || page <= 1}
              className="px-4 py-2 rounded-full font-medium bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md disabled:opacity-50"
            >
              {t('prevPage')}
            </button>
            <span className="px-3 text-sm text-gray-300">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={loading || page >= totalPages}
              className="px-4 py-2 rounded-full font-medium bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md disabled:opacity-50"
            >
              {t('nextPage')}
            </button>
          </div>
        </div>
      )}

      {loading && works.length > 0 && (
        <div className="flex justify-center">
          <button
            disabled
            className="px-6 py-3 rounded-full font-medium bg-white/5 text-white border border-white/10 transition-all backdrop-blur-md flex items-center gap-2 opacity-70"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('loading')}
          </button>
        </div>
      )}
    </div>
  );
}
