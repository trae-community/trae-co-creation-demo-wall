'use client'

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Users, Calendar, Share2, ThumbsUp, Mail, Award, ChevronLeft, ChevronRight, Download, Link2, Check, MapPin, X, Printer } from "lucide-react";
import { Button } from "@/components/common/action-button";
import { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { Work } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorksStore } from '@/lib/works-store';
import { cn } from '@/lib/utils';

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
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [previewTitle, setPreviewTitle] = useState('');
  const [shareImageUrl, setShareImageUrl] = useState('');
  const [isShareGenerating, setIsShareGenerating] = useState(false);
  const [shareActionDone, setShareActionDone] = useState<'copied' | ''>('');
  const [likeAnimating, setLikeAnimating] = useState(false);
  const viewRecorded = useRef(false);
  const touchStartX = useRef(0);
  const screenshotCarouselRef = useRef<HTMLDivElement>(null);

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
  const demoUrl = work?.demoUrl?.trim() || '';
  const repoUrl = work?.repoUrl?.trim() || '';
  const featureLines = (work?.features || '')
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  const scenarioLines = (work?.scenarios || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const emailList = work?.contactEmail ? [work.contactEmail] : [];
  const currentPageUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const normalizeLabel = (label: string) => label.replace(/[:：]\s*$/, '');
  const withColon = (label: string) => `${normalizeLabel(label)}：`;
  const returnToListHref = (() => {
    const from = searchParams.get('from');
    if (!from || !from.startsWith('/')) {
      return '/';
    }
    return from;
  })();

  // Dynamic back button text based on referrer
  const getBackButtonLabel = () => {
    const from = searchParams.get('from');
    if (!from || !from.startsWith('/')) {
      return t('backList');
    }
    if (from.includes('/profile') || from.includes('/user/')) {
      return t('backToProfile');
    }
    if (from.includes('/rankings')) {
      return t('backRankings');
    }
    return t('backList');
  };

  const handleLike = async () => {
    // 乐观更新：立即切换 UI
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 600);

    try {
      const res = await fetch(`/api/works/${id}/like`, { method: 'POST' });
      
      if (res.status === 401) {
        // 未登录，回滚并跳转
        setLiked(prevLiked);
        setLikesCount(prevCount);
        router.push(`/${locale}/sign-in`);
        return;
      }
      
      if (!res.ok) {
        setLiked(prevLiked);
        setLikesCount(prevCount);
        return;
      }
      
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.liked ? prevCount + (prevLiked ? 0 : 1) : prevCount - (prevLiked ? 1 : 0));
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  // 截图轮播键盘导航（必须在 early return 之前）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenshotList.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setActiveScreenshotIndex((prev) => (prev - 1 + screenshotList.length) % screenshotList.length);
      }
      if (e.key === 'ArrowRight') {
        setActiveScreenshotIndex((prev) => (prev + 1) % screenshotList.length);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [screenshotList.length]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 返回按钮骨架 */}
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        {/* 封面区骨架 */}
        <div className="bg-card rounded-2xl overflow-hidden border border-border">
          <div className="aspect-video w-full bg-muted animate-pulse" />
          <div className="p-8 space-y-4">
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            <div className="flex gap-3 pt-4">
              <div className="h-10 w-32 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-24 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        {/* 内容区骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border space-y-3">
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border space-y-3">
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">{t('notFound')}</h2>
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
    const title = truncate(work.name || '-', 21);
    const intro = truncate(work.intro || '-', 87);
    const authorLine = truncate(work.author.name || '-', 20);
    // 简介按每行 29 字换行，最多 3 行（字号 8，对齐竖版设计稿简介区 y 323~355）
    const introLines: string[] = [];
    for (let i = 0; i < intro.length && introLines.length < 3; i += 29) {
      introLines.push(intro.slice(i, i + 29));
    }
    const safe = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    // 生成二维码（内容为当前作品详情页链接，扫码直达）；懒加载避免影响首屏
    let qrSvg = '';
    let qrViewBox = '';
    try {
      const QRCode = (await import('qrcode')).default;
      const rawQr = await QRCode.toString(currentPageUrl, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      // 提取原始 viewBox（模块数随 URL 长度变化，如 31/33/37），再剥离 xmlns/viewBox，
      // 由外层重新提供，避免重复属性导致 XML 非法、图片无法渲染
      const viewBoxMatch = rawQr.match(/viewBox="([^"]*)"/u);
      qrViewBox = viewBoxMatch ? viewBoxMatch[1] : '';
      qrSvg = rawQr
        .replace(/<\?xml[^>]*\?>\s*/u, '')
        .replace(/\sxmlns="[^"]*"/u, '')
        .replace(/\sviewBox="[^"]*"/u, '');
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
    // 加载海报模板（竖版设计稿导出：封面布满 + 底部白色渐隐，动态内容已预剔除）
    // 模板坐标系 viewBox 0 0 283.46 425.2（竖版 100×150mm @72dpi）
    const POSTER_W = 283.46;
    const POSTER_H = 425.2;
    let template = '';
    try {
      const res = await fetch('/images/poster-template.svg');
      if (res.ok) template = await res.text();
    } catch (err) {
      console.error('Poster template load failed:', err);
    }
    // 通过服务端代理获取封面 base64，彻底绕过浏览器 CORS 限制。
    // 代理失败时静默回退内置默认背景图（同域资源，canvas 永远干净），
    // 按作品 id 从 4 套设计稿背景中稳定选取，不打断分享流程。
    const fetchCoverAsDataUrl = async (url: string): Promise<string> => {
      const res = await fetch(`/api/cover-proxy?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`proxy returned ${res.status}`);
      return res.text(); // data:image/...;base64,...
    };
    let coverDataUrl = '';
    if (work.coverUrl) {
      try {
        coverDataUrl = await fetchCoverAsDataUrl(work.coverUrl);
      } catch {
        const fallbackIdx = ((Number(id) || 0) % 4) + 1;
        try {
          coverDataUrl = await fetchCoverAsDataUrl(`/images/poster-default-${fallbackIdx}.jpg`);
        } catch {
          coverDataUrl = '';
        }
      }
    }
    // 注入背景层：优先真实封面（铺满竖版画板居中裁切）；无封面时用深色底填充。
    // 模板中的设计稿示例图已剔除，封面插到裁剪分组末尾（设计稿底层色块之后）避免溢出画板
    const bgLayer = coverDataUrl
      ? `<image width="${POSTER_W}" height="${POSTER_H}" preserveAspectRatio="xMidYMid slice" href="${coverDataUrl}" xlink:href="${coverDataUrl}"/>`
      : `<rect width="${POSTER_W}" height="${POSTER_H}" fill="#1a1d23"/>`;
    if (template) {
      template = template.replace(
        /(<g style="clip-path: url\(#clippath\);">[\s\S]*?)(<\/g>)/u,
        (_m, groupHead, groupClose) => groupHead + bgLayer + groupClose
      );
    }
    const fontStack = "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', Arial, sans-serif";
    // 标题区（模板蓝色标题条 y 292.25~310.1 为静态设计元素，白字单行压在条内）
    const titleSvg =
      `<text x="24.6" y="304.8" fill="#ffffff" font-size="10" font-weight="800" font-family="${fontStack}">${safe(title)}</text>`;
    // 简介区（原设计稿 y 323~355，实测字号约 8，行距约 12.3，深色字适配底部白色渐隐）
    const introSvg = introLines
      .map(
        (line, idx) =>
          `<text x="21.9" y="${330.5 + idx * 12.3}" fill="#1f2937" font-size="8" font-weight="700" font-family="${fontStack}">${safe(line)}</text>`
      )
      .join('\n  ');
    // 二维码白卡（原设计稿占位位置 223.19,368.48 尺寸 41.23×43.56）：真实二维码替换模板占位灰块；
    // 竖版文案在二维码左侧（扫码提示 + @作者）
    const qrCardSvg = qrSvg
      ? `
  <g>
    <rect x="223.19" y="368.48" width="41.23" height="43.56" rx="2.47" fill="#ffffff"/>
    <g transform="translate(225.8, 372.26)"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="${qrViewBox}"${qrSvg.slice('<svg'.length)}</g>
    <text x="218" y="399" text-anchor="end" fill="#4b5563" font-size="8" font-weight="700" font-family="${fontStack}">扫码浏览作品</text>
    <text x="218" y="410.5" text-anchor="end" fill="#111827" font-size="9" font-weight="800" font-family="${fontStack}">@${safe(authorLine)}</text>
  </g>`
      : '';
    // 将动态内容叠加到模板上；模板加载失败时降级为纯色底
    const baseSvg =
      template ||
      `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_W}" height="${POSTER_H}" viewBox="0 0 ${POSTER_W} ${POSTER_H}"><rect width="${POSTER_W}" height="${POSTER_H}" fill="#0b1c3f"/></svg>`;
    const svg = baseSvg.replace(
      '</svg>',
      `\n  ${titleSvg}\n  ${introSvg}\n  ${qrCardSvg}\n</svg>`
    );
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
    // 复制内容带上分享文案，方便直接粘贴到聊天工具里宣传
    const copyText = work
      ? t('shareText', { name: work.name, url: currentPageUrl })
      : currentPageUrl;
    try {
      // 尝试使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyText);
        setShareActionDone('copied');
        setTimeout(() => setShareActionDone(''), 1500);
        return;
      }
    } catch (err) {
      console.error('Clipboard API failed:', err);
    }
    
    // Fallback: 使用传统的 execCommand 方法（移动端兼容性更好）
    try {
      const textArea = document.createElement('textarea');
      textArea.value = copyText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setShareActionDone('copied');
        setTimeout(() => setShareActionDone(''), 1500);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      setShareActionDone('');
    }
  };

  const handlePrintPoster = () => {
    if (!shareImageUrl || !work) return;
    // 创建打印窗口，竖版海报（设计稿 100×150mm，2:3）
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${work.name} - TRAE 创造力大赛</title>
          <style>
            @page {
              size: A3 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f3f4f6;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              body {
                background: white;
              }
              img {
                max-width: none;
                max-height: none;
              }
            }
          </style>
        </head>
        <body>
          <img src="${shareImageUrl}" alt="${work.name}" />
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      // 与竖版模板 viewBox 同比例（283.46×425.2 即 2:3，4 倍导出约 144dpi）
      canvas.width = 1134;
      canvas.height = 1701;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `${work.name || 'work'}-poster`.replace(/[\\/:*?"<>|]+/g, '-');
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

  const openImagePreview = (images: string[], index: number, title: string) => {
    if (images.length === 0) return;
    setPreviewImages(images);
    setPreviewImageIndex(index);
    setPreviewTitle(title);
    setIsImagePreviewOpen(true);
  };

  const showPrevPreviewImage = () => {
    if (previewImages.length <= 1) return;
    setPreviewImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
  };

  const showNextPreviewImage = () => {
    if (previewImages.length <= 1) return;
    setPreviewImageIndex((prev) => (prev + 1) % previewImages.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button
        type="button"
        onClick={() => router.push(returnToListHref)}
        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {getBackButtonLabel()}
      </button>

      {/* 封面区 - 精简 */}
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="aspect-video w-full bg-muted relative group">
          <img
            src={work.coverUrl}
            alt={work.name}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => openImagePreview([work.coverUrl], 0, work.name)}
            title={t('clickToPreview')}
          />
          <div className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-90 pointer-events-none">
            {t('clickToPreview')}
          </div>
        </div>

        {/* 标题和简介 - 移到封面下方 */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            {(work.honors || []).map((honor) => (
              <span key={honor} className="bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-400/20 flex items-center gap-1">
                <Award className="w-3 h-3" />
                {honor}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-card-foreground mb-2">{work.name}</h1>
          <p className="text-muted-foreground text-base leading-relaxed">{work.intro}</p>
        </div>

        {/* 元数据栏 - 分两行 */}
        <div className="flex flex-wrap items-center justify-between p-6 gap-4">
            <div className="flex flex-col gap-4">
              {/* 第一行：标签 */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-500/10 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full border border-green-500/20">
                  {work.category}
                </span>
                {work.tags.map((tag) => (
                  <span key={tag} className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border">
                    #{tag}
                  </span>
                ))}
              </div>
              {/* 第二行：信息 */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{withColon(t('teamMembers'))}</span>
                  <span className="text-foreground">{teamMembers.length > 0 ? teamMembers.length : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{withColon(t('submitTime'))}</span>
                  <span className="text-foreground">{new Date(work.createdAt).toLocaleDateString()}</span>
                </div>
                {(work.country || work.city) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{[work.country, work.city].filter(Boolean).join(' / ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleLike}
                className={`gap-2 transition-all duration-300 px-6 py-2.5 rounded-md font-medium ${
                  liked
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-[0_0_20px_rgba(50,240,140,0.4)] border-transparent scale-105"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border backdrop-blur-md hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(50,240,140,0.1)]"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 transition-transform ${liked ? "fill-current" : ""} ${likeAnimating ? "scale-125" : "scale-100"}`} />
                {liked ? t('liked') : t('likeProject')}
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${liked ? "bg-white/20" : "bg-white/10 text-muted-foreground group-hover:text-foreground"}`}>
                  {likesCount}
                </span>
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('story')}
            </h2>
            <div
              className="prose prose-invert max-w-none leading-relaxed prose-headings:text-card-foreground prose-p:text-muted-foreground prose-strong:text-card-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground prose-blockquote:text-muted-foreground prose-code:text-primary"
              dangerouslySetInnerHTML={{ __html: work.story || '<p>-</p>' }}
            />
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('features')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureLines.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 bg-muted p-4 rounded-xl border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('scenarios')}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {scenarioLines.map((scenario, index) => (
                <div key={`${scenario}-${index}`} className="flex items-start gap-4 bg-muted p-4 rounded-xl border border-border">
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 ring-4 ring-primary/10"></div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{scenario}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('screenshots')}
            </h2>
            {screenshotList.length > 0 ? (
              <div className="space-y-4">
                <div
                  ref={screenshotCarouselRef}
                  tabIndex={0}
                  className="relative rounded-xl overflow-hidden border border-border bg-muted group outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    const diff = e.changedTouches[0].clientX - touchStartX.current;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) showPrevScreenshot();
                      else showNextScreenshot();
                    }
                  }}
                >
                  <img
                    src={screenshotList[activeScreenshotIndex]}
                    alt={`Screenshot ${activeScreenshotIndex + 1}`}
                    className="w-full h-[320px] object-cover cursor-zoom-in"
                    onClick={() => openImagePreview(screenshotList, activeScreenshotIndex, t('screenshots'))}
                    title={t('clickToPreview')}
                  />
                  <div className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-90">
                    {t('clickToPreview')}
                  </div>
                  {screenshotList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrevScreenshot}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                        aria-label="上一张"
                        title="上一张"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextScreenshot}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                        aria-label="下一张"
                        title="下一张"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* 圆点指示器 */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        {screenshotList.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setActiveScreenshotIndex(index)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all",
                              index === activeScreenshotIndex
                                ? "bg-green-400 w-4"
                                : "bg-white/40 hover:bg-white/60"
                            )}
                            aria-label={`第 ${index + 1} 张`}
                          />
                        ))}
                      </div>
                      {/* 计数器 */}
                      <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
                        {activeScreenshotIndex + 1} / {screenshotList.length}
                      </div>
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
                        className={`rounded-lg overflow-hidden border ${index === activeScreenshotIndex ? 'border-primary' : 'border-border'}`}
                      >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">-</div>
            )}
          </section>

        </div>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-3">
            {demoUrl && (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40">
                  <ExternalLink className="w-4 h-4" />
                  {t('tryDemo')}
                </Button>
              </a>
            )}

            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="secondary" className="w-full gap-2 bg-muted hover:bg-muted/80 border-border text-foreground">
                  <Github className="w-4 h-4" />
                  {t('codeRepo')}
                </Button>
              </a>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full gap-2 border-border hover:bg-muted hover:text-foreground hover:border-border/70 text-muted-foreground"
            >
              <Share2 className="w-4 h-4" />
              {t('shareCard')}
            </Button>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('aboutAuthor')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Link
                  href={`/user/${work.author.id}`}
                  className="shrink-0"
                >
                  {work.author.avatar ? (
                    <img
                      src={work.author.avatar}
                      alt={work.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-border hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground border border-border hover:border-primary transition-colors">
                      {work.author.name?.charAt(0) || '?'}
                    </div>
                  )}
                </Link>
                <div>
                  <Link
                    href={`/user/${work.author.id}`}
                    className="text-sm text-foreground font-medium hover:text-primary transition-colors"
                  >
                    {work.author.name || '-'}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">{work.author.bio || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                {emailList.map((email) => (
                  <div key={email} className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{withColon(t('email'))}{email}</span>
                  </div>
                ))}
                {work.teamIntro && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="text-muted-foreground mb-1">{withColon(t('teamIntro'))}</p>
                    <p className="text-foreground">{work.teamIntro}</p>
                  </div>
                )}
                {teamMembers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-muted-foreground text-sm mb-2">{withColon(t('teamMembers'))}</p>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((member) => (
                        <span key={member} className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border">
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

      {/* 底部提示 */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <p className="text-center text-xs text-muted-foreground">{t('aboutProjectDesc')}</p>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-background border border-border text-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg pr-8">{t('shareCardTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              {t('shareCardDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl border border-border bg-gradient-to-br from-card to-background overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] max-w-[260px] sm:max-w-[340px] mx-auto">
              {shareImageUrl ? (
                <img src={shareImageUrl} alt={t('sharePreviewAlt')} className="w-full aspect-[283.46/425.2] object-cover" />
              ) : (
                <div className="h-40 sm:h-56 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  {isShareGenerating ? (
                    <>
                      <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-[shareProgress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs">{t('shareGenerating')}</span>
                    </>
                  ) : '-'}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-muted p-2.5 sm:p-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 break-all">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <span>{currentPageUrl}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2 bg-muted text-foreground border-border w-full sm:w-auto" onClick={handleDownloadShareImage} disabled={!shareImageUrl || isShareGenerating}>
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('downloadImage')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 border-border text-foreground hover:bg-muted w-full sm:w-auto" onClick={handlePrintPoster} disabled={!shareImageUrl || isShareGenerating}>
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('printPoster') || '打印海报'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 border-border text-foreground hover:bg-muted w-full sm:w-auto" onClick={handleCopyLink}>
              {shareActionDone === 'copied' ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {shareActionDone === 'copied' ? t('copied') : t('copyLink')}
            </Button>
            <Button size="sm" className="gap-1.5 sm:gap-2 w-full sm:w-auto" onClick={handleSystemShare}>
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('systemShare')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 轻量级图片预览 */}
      {isImagePreviewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
          
          {previewImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showPrevPreviewImage(); }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                aria-label="上一张"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showNextPreviewImage(); }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                aria-label="下一张"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}
          
          <img
            src={previewImages[previewImageIndex]}
            alt={`${previewTitle}-${previewImageIndex + 1}`}
            className="max-w-[92vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {previewImages.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <span className="text-white text-xs sm:text-sm">{previewImageIndex + 1} / {previewImages.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
