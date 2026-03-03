'use client'

import { Work } from "@/lib/types";
import { MapPin, Users, ArrowRight, TrendingUp, Award, Eye, ThumbsUp, Crown, Star } from "lucide-react";
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
    } catch {
      // Legacy rows may store plain comma-separated names instead of JSON.
    }

    return trimmed
      .split(/[\uFF0C,]/)
      .map((name) => name.trim())
      .filter(Boolean);
  }

  if (typeof team === "object" && "members" in team) {
    return normalizeTeamMembers((team as TeamValue).members);
  }

  return [];
};

export function WorkCard({ work }: WorkCardProps) {
  const t = useTranslations('Card');
  const teamMembers = normalizeTeamMembers(work.team);
  const teamLabel = teamMembers.join(", ");

  return (
    <Link
      href={`/works/${work.id}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] hover:border-green-500/50"
    >
      <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
        <img
          src={work.coverUrl}
          alt={work.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=No+Image";
          }}
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          {work.isFeatured && (
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <Award className="w-3 h-3" />
              {t('cityPick')}
            </div>
          )}
          {work.isTrending && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {t('cityTrending')}
            </div>
          )}
          {work.isCitySelection && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <Crown className="w-3 h-3" />
              {t('cityCurated')}
            </div>
          )}
          {work.isCommunityRecommended && (
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3" />
              {t('communityRecommended')}
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <MapPin className="w-3 h-3" />
            {work.city}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-green-500 transition-colors">
          {work.name}
        </h3>

        <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">
          {work.intro}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {work.tags.map((tag) => {
            const isSpecial = ["已上线", "开源", "持续更新"].includes(tag);
            if (!isSpecial && work.tags.indexOf(tag) > 2) return null;

            return (
              <span
                key={tag}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  isSpecial
                    ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                    : "bg-white/5 text-gray-500 border-white/5"
                }`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            {teamMembers.length > 0 && (
              <div className="flex items-center gap-1" title={teamLabel}>
                <Users className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">
                  {teamLabel}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {work.views}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {work.likes}
            </div>
            <span className="text-green-500 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {t('viewDetails')} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

