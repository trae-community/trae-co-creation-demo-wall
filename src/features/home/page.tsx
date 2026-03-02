'use client'

import { useState, useEffect } from "react";
import { PROJECTS } from "../../data/projects";
import { ProjectCard } from "../../components/ProjectCard";
import { CityFilter, FilterState } from "../../components/CityFilter";
import { Search, Clock, ThumbsUp, Eye } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Project } from "../../types";

export function HomePage() {
  const t = useTranslations('Home');
  const [filters, setFilters] = useState<FilterState>({
    cities: [],
    categories: [],
    tags: [],
    countries: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'time' | 'likes' | 'views'>('time');
  const [statsMap, setStatsMap] = useState<Record<string, { viewCount: number; likeCount: number }>>({});

  useEffect(() => {
    const ids = PROJECTS.map((p) => p.id).join(",");
    if (!ids) return;
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/api/works/stats?ids=${encodeURIComponent(ids)}`
      : `/api/works/stats?ids=${ids}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object") setStatsMap(data);
      })
      .catch(() => {});
  }, []);

  const mergeStats = (p: Project): Project => {
    const s = statsMap[p.id];
    if (!s) return p;
    return { ...p, views: s.viewCount, likes: s.likeCount };
  };

  const filteredProjects = PROJECTS.map(mergeStats).filter((project) => {
    const matchCity = filters.cities.length === 0 || filters.cities.includes(project.city);
    const matchCategory = filters.categories.length === 0 || filters.categories.includes(project.category);
    const matchCountry = filters.countries.length === 0 || filters.countries.includes(project.country);
    const matchTags = filters.tags.length === 0 || project.tags.some(tag => filters.tags.includes(tag));

    const matchSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        project.intro.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchCategory && matchCountry && matchTags && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'likes') {
      return (b.likes || 0) - (a.likes || 0);
    } else if (sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

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
      <div id="projects" className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 py-6 space-y-6 transition-all duration-300">
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
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
    </div>
  );
}
