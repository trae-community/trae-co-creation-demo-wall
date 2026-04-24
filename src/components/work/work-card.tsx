'use client'

import { usePathname, useSearchParams } from "next/navigation";
import { Work } from "@/lib/types";
import { MapPin, Award, Eye, ThumbsUp, Clock } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';

interface WorkCardProps {
  work: Work;
}

type TeamValue = { value?: unknown; members?: unknown };

const normalizeTeamMembers = (team: unknown): string[] => {
  if (!team) return [];
  if (Array.isArray(team)) {
    return team
      .map((member) => {
        if (typeof member === "string") return member.trim();
        if (member && typeof member === "object" && "value" in member) {
          return String((member as TeamValue).value ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof team === "string") {
    const trimmed = team.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      const parsedMembers = normalizeTeamMembers(parsed);
      if (parsedMembers.length > 0) return parsedMembers;
    } catch { /* legacy plain text */ }
    return trimmed.split(/[\uFF0C,]/).map((n) => n.trim()).filter(Boolean);
  }
  if (typeof team === "object" && "members" in team) {
    return normalizeTeamMembers((team as TeamValue).members);
  }
  return [];
};

export function WorkCard({ work }: WorkCardProps) {
  const t = useTranslations('Card');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamMembers = normalizeTeamMembers(work.team);
  const isTeam = teamMembers.length > 1;
  const hasHonors = (work.honors || []).length > 0;

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };
  const currentListHref = (() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();
  const detailHref = `/works/${work.id}?from=${encodeURIComponent(currentListHref)}`;

  // Show at most 3 tags, prioritise "special" ones
  const specialTags = work.tags.filter(tag => ["已上线", "开源", "持续更新"].includes(tag));
  const otherTags = work.tags.filter(tag => !["已上线", "开源", "持续更新"].includes(tag));
  const displayTags = [...specialTags, ...otherTags].slice(0, 3);

  return (
    <Link
      href={detailHref}
      className="group flex h-full flex-col rounded-2xl overflow-hidden border border-white/8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_32px_rgba(34,197,94,0.2)] hover:border-green-500/35"
      style={{ background: '#111318' }}
    >
      {/* Cover — 4:3 ratio */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={work.coverUrl}
          alt={work.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/600x450?text=No+Image";
          }}
        />

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="text-white text-sm font-medium flex items-center gap-1.5">
            {t('viewDetails')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </span>
        </div>

        {/* Honor badges — top left */}
        {hasHonors && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {(work.honors || []).map((honor) => (
              <span
                key={honor}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-amber-300 border border-amber-500/30 backdrop-blur-sm"
                style={{ background: 'rgba(245,158,11,0.15)' }}
              >
                <Award className="w-3 h-3" />
                {honor}
              </span>
            ))}
          </div>
        )}

        {/* Category pill — bottom right */}
        {work.category && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-0.5 rounded-md text-xs text-zinc-300 border border-white/10 backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              {work.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1 group-hover:text-green-400 transition-colors [overflow-wrap:anywhere]">
            {work.name}
          </h3>
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-4 [overflow-wrap:anywhere]">
            {work.intro}
          </p>
        </div>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displayTags.map((tag) => {
              const isSpecial = ["已上线", "开源", "持续更新"].includes(tag);
              return (
                <span
                  key={tag}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    isSpecial
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-white/5 text-zinc-600 border-white/8"
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer: author + time + stats */}
        <div className="flex min-w-0 items-center justify-between gap-3 pt-3.5 border-t border-white/6 mt-auto">
          {/* Author / team */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {isTeam ? (
              <>
                <div className="flex shrink-0 -space-x-1.5">
                  {teamMembers.slice(0, 3).map((member, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-zinc-900 bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300"
                    >
                      {member.charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-zinc-300 font-medium leading-none truncate">
                    {teamMembers.length}{t('people') || '人团队'}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-0.5 flex min-w-0 items-center gap-1">
                    {work.city && (
                      <>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{work.city}</span>
                        <span className="text-zinc-700">·</span>
                      </>
                    )}
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>{formatDate(work.createdAt)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 border border-zinc-600">
                  {work.author?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <div className="max-w-[80px] text-xs text-zinc-300 font-medium leading-none line-clamp-1 [overflow-wrap:anywhere]">
                    {work.author?.name || teamMembers[0] || '-'}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-0.5 flex min-w-0 items-center gap-1">
                    {work.city && (
                      <>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{work.city}</span>
                        <span className="text-zinc-700">·</span>
                      </>
                    )}
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>{formatDate(work.createdAt)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stats — eye-catching */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400/80">
              <Eye className="w-3.5 h-3.5" />
              {work.views >= 1000 ? `${(work.views / 1000).toFixed(1)}k` : work.views}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400/80">
              <ThumbsUp className="w-3.5 h-3.5" />
              {work.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
