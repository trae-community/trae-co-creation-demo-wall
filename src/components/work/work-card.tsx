'use client'

import { Work } from "@/lib/types";
import { MapPin, Award, Eye, ThumbsUp, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/lib/language/navigation';
import { workAssets } from '@/lib/work';
import { RemoteImage } from '@/components/common/remote-image';
import { hrefWithFrom } from '@/lib/navigation-from';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const tWork = useTranslations('Work');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(work.likes ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const teamMembers = normalizeTeamMembers(work.team);
  const isTeam = teamMembers.length > 1;
  const hasHonors = (work.honors || []).length > 0;

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale);
  };
  const currentListHref = (() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();
  const detailHref = hrefWithFrom(`/works/${work.id}`, currentListHref);

  // Show at most 3 tags, prioritise "special" ones
  const specialTags = work.tags.filter(tag => ["已上线", "开源", "持续更新"].includes(tag));
  const otherTags = work.tags.filter(tag => !["已上线", "开源", "持续更新"].includes(tag));
  const displayTags = [...specialTags, ...otherTags].slice(0, 3);
  const authorHref = hrefWithFrom(`/user/${work.author.id}`, currentListHref);

  const handleAuthorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(authorHref);
  };

  const handleLikeClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLiking) return;
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setIsLiking(true);
    try {
      const res = await fetch(`/api/works/${work.id}/like`, { method: 'POST' });
      if (res.status === 401) {
        setLiked(prevLiked);
        setLikesCount(prevCount);
        toast.message(tWork('likeLoginRequired'));
        const returnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        router.push(`/${locale}/sign-in?callbackUrl=${encodeURIComponent(returnPath)}`);
        return;
      }
      if (!res.ok) {
        setLiked(prevLiked);
        setLikesCount(prevCount);
        toast.error(tWork('likeFailed'));
        return;
      }
      const data = await res.json();
      setLiked(Boolean(data.liked));
      if (typeof data.likeCount === 'number') setLikesCount(data.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(tWork('likeFailed'));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link
      href={detailHref}
      className="group flex h-full flex-col rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_32px_rgba(50,240,140,0.2)] hover:border-green-500/35"
    >
      {/* Cover — 4:3 ratio */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <RemoteImage
          src={work.coverUrl}
          alt={work.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fallbackSrc={workAssets.placeholder}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="text-white text-sm font-medium flex items-center gap-1.5">
            {t('viewDetails')}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>

        {/* Honor badges — top left */}
        {hasHonors && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {(work.honors || []).map((honor) => (
              <span
                key={honor}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-amber-950 border border-amber-300/60 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
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
            <span className="px-2 py-0.5 rounded-md text-xs text-foreground border border-border backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              {work.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="font-bold text-card-foreground text-base mb-1.5 line-clamp-1 group-hover:text-green-400 transition-colors [overflow-wrap:anywhere]">
            {work.name}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4 [overflow-wrap:anywhere]">
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
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer: author + time + stats */}
        <div className="flex min-w-0 items-center justify-between gap-3 pt-3.5 border-t border-border mt-auto">
          {/* Author / team */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {isTeam ? (
              <>
                <div className="flex shrink-0 -space-x-1.5">
                  {teamMembers.slice(0, 3).map((member, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-border bg-muted flex items-center justify-center text-[9px] font-bold text-foreground"
                    >
                      {member.charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-foreground font-medium leading-none truncate">
                    {teamMembers.length}{t('people') || '人团队'}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1">
                    {work.city && (
                      <>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{work.city}</span>
                        <span className="text-muted-foreground">·</span>
                      </>
                    )}
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>{formatDate(work.createdAt)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAuthorClick}
                  className="w-6 h-6 rounded-full overflow-hidden border border-border hover:border-primary transition-colors shrink-0 bg-muted"
                  aria-label={`查看作者 ${work.author?.name || ''}`}
                >
                  {work.author?.avatar ? (
                    <RemoteImage
                      src={work.author.avatar}
                      alt={work.author.name}
                      width={32}
                      height={32}
                      sizes="32px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[10px] font-bold text-foreground">
                      {work.author?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </button>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={handleAuthorClick}
                    className="max-w-[80px] text-left text-xs text-foreground font-medium leading-none line-clamp-1 [overflow-wrap:anywhere] hover:text-primary transition-colors"
                    title={work.author?.name || teamMembers[0] || '-'}
                  >
                    {work.author?.name || teamMembers[0] || '-'}
                  </button>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1">
                    {work.city && (
                      <>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{work.city}</span>
                        <span className="text-muted-foreground">·</span>
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
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400/80">
              <Eye className="w-3.5 h-3.5" />
              {work.views >= 1000 ? `${(work.views / 1000).toFixed(1)}k` : work.views}
            </span>
            <button
              type="button"
              disabled={isLiking}
              onClick={handleLikeClick}
              aria-label={liked ? tWork('liked') : tWork('likeProject')}
              aria-pressed={liked}
              className={cn(
                'flex items-center gap-1 text-[11px] font-semibold rounded-full px-1.5 py-0.5 border transition-colors',
                liked
                  ? 'text-green-300 border-green-500/40 bg-green-500/15'
                  : 'text-green-400/80 border-transparent hover:border-green-500/30'
              )}
            >
              <ThumbsUp className={cn('w-3.5 h-3.5', liked && 'fill-current')} />
              {likesCount}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
