'use client'

import { Work } from "@/lib/types";
import { MapPin, Users, Award, Eye, ThumbsUp } from "lucide-react";
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
  const teamMembers = normalizeTeamMembers(work.team);
  const isTeam = teamMembers.length > 1;
  const hasHonors = (work.honors || []).length > 0;

  // Show at most 3 tags, prioritise "special" ones
  const specialTags = work.tags.filter(tag => ["已上线", "开源", "持续更新"].includes(tag));
  const otherTags = work.tags.filter(tag => !["已上线", "开源", "持续更新"].includes(tag));
  const displayTags = [...specialTags, ...otherTags].slice(0, 3);
  const authorName = work.author?.name || teamMembers[0] || '-';
  const authorInitial = authorName.charAt(0) || '?';

  return (
    <Link
      href={`/works/${work.id}`}
      className="group panel-shell noise-overlay block overflow-hidden rounded-[1.6rem] transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-300/25 hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(6,10,14,0.28)_52%,rgba(6,10,14,0.92)_100%)] z-10" />
        <img
          src={work.coverUrl}
          alt={work.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/600x450?text=No+Image";
          }}
        />

        <div className="absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {hasHonors && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                <Award className="w-3 h-3" />
                {(work.honors || [])[0]}
              </span>
            )}
            {work.category && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                {work.category}
              </span>
            )}
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-300">
            No.{String(work.id).padStart(2, '0')}
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Showcase
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition duration-300 group-hover:opacity-100">
              {t('viewDetails')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] text-slate-200">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {work.views >= 1000 ? `${(work.views / 1000).toFixed(1)}k` : work.views}
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {work.likes}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
              {work.city || 'Remote'}
            </p>
            <h3 className="mt-2 line-clamp-1 font-display text-xl font-bold text-white transition-colors group-hover:text-emerald-200">
              {work.name}
            </h3>
          </div>
          {isTeam && (
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] text-slate-300">
              <Users className="w-3 h-3" />
              {teamMembers.length}
            </div>
          )}
        </div>

        <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-400">{work.intro}</p>

        {displayTags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {displayTags.map((tag) => {
              const isSpecial = ["已上线", "开源", "持续更新"].includes(tag);
              return (
                <span
                  key={tag}
                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                    isSpecial
                      ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-200"
                      : "border-white/8 bg-white/[0.035] text-slate-400"
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            {isTeam ? (
              <>
                <div className="flex -space-x-2">
                  {teamMembers.slice(0, 3).map((member, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-950 bg-slate-700 text-[10px] font-bold text-slate-200 glow-ring"
                    >
                      {member.charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium leading-none text-zinc-200">
                    {teamMembers.length}{t('people') || '人团队'}
                  </div>
                  {work.city && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="w-2.5 h-2.5" />
                      {work.city}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {work.author?.avatar ? (
                  <img
                    src={work.author.avatar}
                    alt={authorName}
                    className="h-9 w-9 rounded-full border border-white/10 object-cover glow-ring"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-700 text-xs font-bold text-slate-200 glow-ring">
                    {authorInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="line-clamp-1 max-w-[120px] text-sm font-medium leading-none text-zinc-200">
                    {authorName}
                  </div>
                  {work.city && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="w-2.5 h-2.5" />
                      {work.city}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Open case
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-200">
              Explore
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
