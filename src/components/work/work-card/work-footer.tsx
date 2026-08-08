'use client'

import { Eye, ThumbsUp, MapPin, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface WorkFooterProps {
  author: { id: string; name?: string | null; avatar?: string | null };
  team?: unknown;
  city?: string | null;
  createdAt: Date | string;
  views: number;
  likes: number;
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

export function WorkFooter({ 
  author, 
  team, 
  city, 
  createdAt,
  views, 
  likes 
}: WorkFooterProps) {
  const t = useTranslations('Card');
  const router = useRouter();
  const teamMembers = normalizeTeamMembers(team);
  const isTeam = teamMembers.length > 1;
  
  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleAuthorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/user/${author.id}`);
  };

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 pt-3.5 border-t border-white/5 mt-auto">
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
                {city && (
                  <>
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{city}</span>
                    <span className="text-zinc-700">·</span>
                  </>
                )}
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAuthorClick}
              className="w-6 h-6 rounded-full overflow-hidden border border-zinc-600 hover:border-primary transition-colors shrink-0 bg-zinc-700"
              aria-label={`查看作者 ${author.name || ''}`}
            >
              {author.avatar ? (
                <img src={author.avatar} alt={author.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-[10px] font-bold text-zinc-300">
                  {author.name ? author.name.charAt(0) : '?'}
                </span>
              )}
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={handleAuthorClick}
                className="max-w-[80px] text-left text-xs text-zinc-300 font-medium leading-none line-clamp-1 [overflow-wrap:anywhere] hover:text-primary transition-colors"
                title={author.name || teamMembers[0] || '-'}
              >
                {author.name || teamMembers[0] || '-'}
              </button>
              <div className="text-[10px] text-zinc-600 mt-0.5 flex min-w-0 items-center gap-1">
                {city && (
                  <>
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{city}</span>
                    <span className="text-zinc-700">·</span>
                  </>
                )}
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats — eye-catching */}
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400/80">
          <Eye className="w-3.5 h-3.5" />
          {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400/80">
          <ThumbsUp className="w-3.5 h-3.5" />
          {likes}
        </span>
      </div>
    </div>
  );
}
