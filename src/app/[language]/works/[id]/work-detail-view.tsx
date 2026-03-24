'use client'

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Users, Calendar, Share2, ThumbsUp, Mail, Award, ChevronLeft, ChevronRight, Download, Link2, Check } from "lucide-react";
import { Button } from "@/components/common/action-button";
import { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { Work } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorksStore } from '@/store/works-store';

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'value' in item) {
          return String((item as { value?: unknown }).value ?? '').trim();
        }
        return String(item).trim();
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export function WorkDetailView() {
  const t = useTranslations('Work');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState('');
  const [isShareGenerating, setIsShareGenerating] = useState(false);
  const [shareActionDone, setShareActionDone] = useState<'copied' | ''>('');
  const viewRecorded = useRef(false);

  const { detailCache, setDetailCache } = useWorksStore();

  // 获取作品详情 (cache-first) + stats (always fresh)
  useEffect(() => {
    const fetchWork = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // Cache hit: render immediately, skip detail network request
      const cached = detailCache.get(id);
      if (cached) {
        setWork(cached);
        setIsLoading(false);
        // Still fetch fresh stats in background
        fetch(`/api/works/${id}/stats`)
          .then(r => r.ok ? r.json() : null)
          .then(stats => {
            if (stats) {
              setLikesCount(stats.likeCount || 0);
              setViewsCount(stats.viewCount || 0);
              setLiked(stats.liked || false);
            }
          })
          .catch(() => {});
        return;
      }

      try {
        const [workRes, statsRes] = await Promise.all([
          fetch(`/api/works/${id}?lang=${encodeURIComponent(locale)}`),
          fetch(`/api/works/${id}/stats`),
        ]);

        if (!workRes.ok) {
          setWork(null);
          return;
        }

        const data: Work = await workRes.json();
        setWork(data);
        setDetailCache(id, data);

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setLikesCount(stats.likeCount || 0);
          setViewsCount(stats.viewCount || 0);
          setLiked(stats.liked || false);
        }
      } catch {
        setWork(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWork();
  }, [id, locale, detailCache, setDetailCache]);

  // 记录浏览量（使用 ref 去重，避免 Strict Mode 双次）
  useEffect(() => {
    if (!id || viewRecorded.current) return;
    
    viewRecorded.current = true;
    
    fetch(`/api/works/${id}/view`, { method: 'POST' })
      .then((res) => res.ok ? res.json() : null)
      .then(() => {
        setViewsCount((prev) => prev + 1);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setActiveScreenshotIndex(0);
  }, [work?.id]);

  const teamMembers = toStringList(work?.team);
  const screenshotList = work?.screenshots || [];
  const featureLines = (work?.features || '')
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  const scenarioLines = (work?.scenarios || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const emailList = work?.contactEmail ? [work.contactEmail] : [];
  const currentPageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const normalizeLabel = (label: string) => label.replace(/[:：]\s*$/, '');
  const withColon = (label: string) => `${normalizeLabel(label)}：`;

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/works/${id}/like`, { method: 'POST' });
      
      if (res.status === 401) {
        // 未登录，跳转到登录页
        router.push(`/${locale}/sign-in`);
        return;
      }
      
      if (!res.ok) return;
      
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount((prev) => data.liked ? prev + 1 : Math.max(0, prev - 1));
    } catch {
      // 忽略错误
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Loading...</h2>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">{t('notFound')}</h2>
        <Link href="/" className="text-primary hover:underline mt-4 block">
          {t('backHome')}
        </Link>
      </div>
    );
  }

  const generateShareImage = async () => {
    if (!work) return;
    setIsShareGenerating(true);
    const truncate = (value: string, max: number) => {
      const text = value.trim();
      return text.length > max ? `${text.slice(0, max)}...` : text;
    };
    const title = truncate(work.name || '-', 32);
    const intro = truncate(work.intro || '-', 70);
    const locationLine = truncate(`${work.city || '-'} · ${work.country || '-'}`, 24);
    const categoryLine = truncate(work.category || '-', 12);
    const tagList = work.tags.slice(0, 3).map((tag) => truncate(tag, 12));
    const honorList = (work.honors || []).slice(0, 2).map((honor) => truncate(honor, 14));
    const createdAtText = new Date(work.createdAt).toLocaleDateString(locale || 'zh-CN');
    const siteTitle = 'TRAE DEMO WALL';
    const likeLabel = withColon(t('likeProject'));
    const submitLabel = withColon(t('submitTime'));
    const teamLabel = withColon(t('teamMembers'));
    const authorLine = truncate(work.author.name || '-', 20);
    const safe = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const honorSvg = honorList
      .map(
        (honor, index) => `
  <rect x="884" y="${104 + index * 44}" width="220" height="32" rx="16" fill="rgba(250,204,21,0.18)" stroke="rgba(250,204,21,0.38)"/>
  <text x="994" y="${125 + index * 44}" text-anchor="middle" fill="#fef08a" font-size="15" font-family="Arial, sans-serif" font-weight="700">${safe(honor)}</text>`
      )
      .join('');
    const tagSvg = tagList
      .map(
        (tag, index) => `
  <rect x="${250 + index * 180}" y="430" width="168" height="30" rx="15" fill="rgba(39,39,42,0.78)" stroke="rgba(255,255,255,0.08)"/>
  <text x="${334 + index * 180}" y="450" text-anchor="middle" fill="#d4d4d8" font-size="14" font-family="Arial, sans-serif">#${safe(tag)}</text>`
      )
      .join('');
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
    <linearGradient id="heroMask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.15)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.70)"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#pageBg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="28" fill="#111827" stroke="rgba(255,255,255,0.12)" filter="url(#softShadow)"/>
  <rect x="76" y="76" width="1048" height="298" rx="22" fill="url(#heroBg)"/>
  <rect x="76" y="76" width="1048" height="298" rx="22" fill="url(#heroMask)"/>
  <rect x="104" y="102" width="240" height="36" rx="18" fill="url(#accent)"/>
  <text x="224" y="126" text-anchor="middle" fill="#052e16" font-size="16" font-family="Arial, sans-serif" font-weight="700">${safe(locationLine)}</text>
  ${honorSvg}
  <text x="104" y="282" fill="#ffffff" font-size="56" font-family="Arial, sans-serif" font-weight="700">${safe(title)}</text>
  <text x="104" y="326" fill="#e4e4e7" font-size="25" font-family="Arial, sans-serif">${safe(intro)}</text>
  <rect x="76" y="398" width="1048" height="132" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)"/>
  <rect x="104" y="430" width="128" height="30" rx="15" fill="rgba(34,197,94,0.14)" stroke="rgba(34,197,94,0.36)"/>
  <text x="168" y="450" text-anchor="middle" fill="#86efac" font-size="14" font-family="Arial, sans-serif">${safe(categoryLine)}</text>
  ${tagSvg}
  <text x="104" y="500" fill="#a1a1aa" font-size="17" font-family="Arial, sans-serif">${safe(teamLabel)} ${safe(String(teamMembers.length || 0))}</text>
  <text x="372" y="500" fill="#a1a1aa" font-size="17" font-family="Arial, sans-serif">${safe(submitLabel)} ${safe(createdAtText)}</text>
  <text x="710" y="500" fill="#a1a1aa" font-size="17" font-family="Arial, sans-serif">${safe(likeLabel)} ${safe(String(work.likes || 0))}</text>
  <text x="930" y="500" fill="#a1a1aa" font-size="17" font-family="Arial, sans-serif">Views：${safe(String(viewsCount || 0))}</text>
  <text x="76" y="574" fill="#64748b" font-size="16" font-family="Arial, sans-serif">${safe(currentPageUrl)}</text>
  <text x="1124" y="574" text-anchor="end" fill="#22c55e" font-size="18" font-family="Arial, sans-serif" font-weight="700">${safe(siteTitle)} · ${safe(authorLine)}</text>
</svg>`;
    setShareImageUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    setIsShareGenerating(false);
  };

  const handleShare = async () => {
    setIsShareDialogOpen(true);
    setShareActionDone('');
    await generateShareImage();
  };

  const handleCopyLink = async () => {
    if (!currentPageUrl) return;
    try {
      await navigator.clipboard.writeText(currentPageUrl);
      setShareActionDone('copied');
      setTimeout(() => setShareActionDone(''), 1500);
    } catch {
      setShareActionDone('');
    }
  };

  const handleSystemShare = async () => {
    if (!work || !currentPageUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: work.name,
          text: work.intro,
          url: currentPageUrl,
        });
      } catch {
        return;
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleDownloadShareImage = () => {
    if (!shareImageUrl || !work) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `${work.name || 'work'}-share-card`.replace(/[\\/:*?"<>|]+/g, '-');
      link.href = downloadUrl;
      link.download = `${fileName}.png`;
      link.click();
    };
    image.src = shareImageUrl;
  };

  const showPrevScreenshot = () => {
    if (screenshotList.length <= 1) return;
    setActiveScreenshotIndex((prev) => (prev - 1 + screenshotList.length) % screenshotList.length);
  };

  const showNextScreenshot = () => {
    if (screenshotList.length <= 1) return;
    setActiveScreenshotIndex((prev) => (prev + 1) % screenshotList.length);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-gray-400 transition-colors hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('backList')}
      </Link>

      <div className="panel-shell overflow-hidden rounded-[2rem]">
        <div className="relative w-full overflow-hidden bg-zinc-900 aspect-video">
          <div className="absolute inset-0 hero-mesh opacity-40 z-10" />
          <img
            src={work.coverUrl}
            alt={work.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-[#060a0e]/95 via-[#060a0e]/45 to-transparent">
            <div className="w-full p-6 text-white md:p-8 lg:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1.5 text-xs font-bold text-emerald-200">
                  {work.city} · {work.country}
                </span>
                {(work.honors || []).map((honor) => (
                  <span key={honor} className="flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/12 px-3 py-1.5 text-xs font-bold text-amber-200">
                    <Award className="w-3 h-3" />
                    {honor}
                  </span>
                ))}
              </div>
              <h1 className="font-display text-4xl font-bold leading-[0.95] md:text-5xl lg:max-w-4xl lg:text-6xl">{work.name}</h1>
              <p className="mt-4 max-w-2xl text-base text-gray-200 md:text-lg">{work.intro}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/6 bg-black/10 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white">
                  {work.category}
                </span>
                {work.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-gray-300 px-2.5 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{withColon(t('teamMembers'))}</span>
                  <span className="text-gray-200">{teamMembers.length > 0 ? teamMembers.length : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{withColon(t('submitTime'))}</span>
                  <span className="text-gray-200">{new Date(work.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleLike}
                className={`gap-2 transition-all duration-300 px-6 py-2.5 rounded-full font-medium ${
                  liked
                    ? "scale-105 border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    : "border border-white/10 bg-zinc-800/80 text-gray-300 backdrop-blur-md hover:border-green-500/50 hover:bg-zinc-800 hover:text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                {liked ? t('liked') : t('likeProject')}
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${liked ? "bg-white/20" : "bg-white/5 text-gray-400 group-hover:text-white"}`}>
                  {likesCount}
                </span>
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <section className="panel-shell rounded-[1.75rem] p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('story')}
            </h2>
            <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: work.story || '<p>-</p>' }}
              />
          </section>

          <section className="panel-shell rounded-[1.75rem] p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('features')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureLines.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-shell rounded-[1.75rem] p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('scenarios')}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {scenarioLines.map((scenario, index) => (
                <div key={`${scenario}-${index}`} className="flex items-start gap-4 rounded-xl border border-white/5 bg-zinc-900/30 p-4">
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 ring-4 ring-primary/10"></div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{scenario}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-shell rounded-[1.75rem] p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('screenshots')}
            </h2>
            {screenshotList.length > 0 ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60">
                  <img
                    src={screenshotList[activeScreenshotIndex]}
                    alt={`Screenshot ${activeScreenshotIndex + 1}`}
                    className="w-full h-[320px] object-cover"
                  />
                  {screenshotList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrevScreenshot}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextScreenshot}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {screenshotList.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {screenshotList.map((url, index) => (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        onClick={() => setActiveScreenshotIndex(index)}
                        className={`rounded-lg overflow-hidden border ${index === activeScreenshotIndex ? 'border-primary' : 'border-zinc-800'}`}
                      >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </section>

        </div>

        <div className="space-y-6">
          <div className="panel-shell flex flex-col gap-3 rounded-[1.6rem] p-6">
            <a href={work.demoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40">
                <ExternalLink className="w-4 h-4" />
                {t('tryDemo')}
              </Button>
            </a>

            {work.repoUrl && (
              <a href={work.repoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="secondary" className="w-full gap-2 bg-white/10 hover:bg-white/20 border-white/5 text-white">
                  <Github className="w-4 h-4" />
                  {t('codeRepo')}
                </Button>
              </a>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full gap-2 border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-gray-400"
            >
              <Share2 className="w-4 h-4" />
              {t('shareCard')}
            </Button>
          </div>

          <div className="panel-shell rounded-[1.6rem] p-6">
            <h3 className="font-bold text-primary mb-2">{t('aboutProject')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('aboutProjectDesc')}</p>
            <div className="text-sm text-gray-300 space-y-2">
              <p><span className="text-gray-500">{withColon(t('country'))}</span>{work.country || '-'}</p>
              <p><span className="text-gray-500">{withColon(t('city'))}</span>{work.city || '-'}</p>
            </div>
          </div>

          <div className="panel-shell noise-overlay rounded-[1.6rem] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-primary">
              <Users className="w-4 h-4" />
              {t('aboutAuthor')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-white/6 bg-white/[0.025] p-4">
                {work.author.avatar ? (
                  <img
                    src={work.author.avatar}
                    alt={work.author.name}
                    className="h-12 w-12 rounded-full border border-zinc-700 object-cover glow-ring"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-700 text-sm font-bold text-slate-200 glow-ring">
                    {(work.author.name || '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold text-gray-100">{work.author.name || '-'}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-400">{work.author.bio || '-'}</p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                {emailList.map((email) => (
                  <div key={email} className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{withColon(t('email'))}{email}</span>
                  </div>
                ))}
                {work.teamIntro && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p className="text-gray-500 mb-1">{withColon(t('teamIntro'))}</p>
                    <p className="text-gray-300">{work.teamIntro}</p>
                  </div>
                )}
                {teamMembers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm mb-2">{withColon(t('teamMembers'))}</p>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((member) => (
                        <span key={member} className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-gray-300">
                          {member}
                        </span>
                      ))}
                    </div>
                </div>
                )}
            </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('shareCardTitle')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t('shareCardDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {shareImageUrl ? (
                <img src={shareImageUrl} alt={t('sharePreviewAlt')} className="w-full aspect-[1200/630] object-cover" />
              ) : (
                <div className="h-56 flex items-center justify-center text-zinc-500 text-sm">
                  {isShareGenerating ? t('shareGenerating') : '-'}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300 flex items-center gap-2 break-all">
              <Link2 className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>{currentPageUrl}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" className="gap-2 bg-white/10 text-white border-white/10" onClick={handleDownloadShareImage} disabled={!shareImageUrl || isShareGenerating}>
              <Download className="w-4 h-4" />
              {t('downloadImage')}
            </Button>
            <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10" onClick={handleCopyLink}>
              {shareActionDone === 'copied' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {shareActionDone === 'copied' ? t('copied') : t('copyLink')}
            </Button>
            <Button className="gap-2" onClick={handleSystemShare}>
              <Share2 className="w-4 h-4" />
              {t('systemShare')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
