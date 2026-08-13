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
  const currentPageUrl = typeof window !== 'undefined' ? window.location.href : '';
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
        <div className="h-5 w-20 rounded bg-white/5 animate-pulse" />
        {/* 封面区骨架 */}
        <div className="bg-card rounded-2xl overflow-hidden border border-border">
          <div className="aspect-video w-full bg-zinc-900 animate-pulse" />
          <div className="p-8 space-y-4">
            <div className="h-8 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
            <div className="flex gap-3 pt-4">
              <div className="h-10 w-32 rounded-full bg-white/5 animate-pulse" />
              <div className="h-10 w-24 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
        {/* 内容区骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border space-y-3">
                <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-3">
              <div className="h-10 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-10 w-full rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
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
    const title = truncate(work.name || '-', 38);
    const intro = truncate(work.intro || '-', 84);
    const authorLine = truncate(work.author.name || '-', 20);
    // 标题超长时拆成两行，避免溢出画面（字号 32 时每行约 18 字）
    const titleLines = title.length > 18 ? [title.slice(0, 18), title.slice(18)] : [title];
    // 简介按每行 36 字换行，最多 2 行（字号 24，对齐原设计稿简介区 y 638~717）
    const introLines: string[] = [];
    for (let i = 0; i < intro.length && introLines.length < 2; i += 36) {
      introLines.push(intro.slice(i, i + 36));
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
    // 加载海报模板（设计稿导出：封面布满 + 底部白色渐隐，动态内容已预剔除）
    // 模板坐标系 viewBox 0 0 1190.55 841.89（A3 横版 @72dpi）
    let template = '';
    try {
      const res = await fetch('/images/poster-template.svg');
      if (res.ok) template = await res.text();
    } catch (err) {
      console.error('Poster template load failed:', err);
    }
    // 将作品封面转为 base64 内嵌进 SVG，保证预览与 canvas 导出不受跨域限制；
    // 同时返回 Image 元素，供后续采样封面亮度决定 logo 颜色
    const toDataUrl = (url: string, timeoutMs = 8000): Promise<{ dataUrl: string; img: HTMLImageElement }> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('cover load timeout')), timeoutMs);
        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas context unavailable');
            ctx.drawImage(img, 0, 0);
            resolve({ dataUrl: canvas.toDataURL('image/png'), img });
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => {
          clearTimeout(timer);
          reject(new Error('cover load failed'));
        };
        img.src = url;
      });
    let coverDataUrl = '';
    let coverImg: HTMLImageElement | null = null;
    if (work.coverUrl) {
      try {
        const r = await toDataUrl(work.coverUrl);
        coverDataUrl = r.dataUrl;
        coverImg = r.img;
      } catch (err) {
        console.error('Cover image embedding failed:', err);
      }
    }
    // logo 主题自适应：按 slice 铺满规则模拟裁切，采样左上角 logo 区域的平均亮度，
    // 亮色封面（如纯白图）用黑 logo，暗色封面用白 logo
    const logoFill = (() => {
      if (!coverImg || !coverImg.naturalWidth) return '#ffffff'; // 无封面时底是深色
      try {
        const W = 1190.55, H = 841.89;
        const scale = Math.max(W / coverImg.naturalWidth, H / coverImg.naturalHeight);
        const dw = coverImg.naturalWidth * scale;
        const dh = coverImg.naturalHeight * scale;
        const sc = document.createElement('canvas');
        sc.width = 300;
        sc.height = Math.round((300 * H) / W);
        const sctx = sc.getContext('2d');
        if (!sctx) return '#ffffff';
        sctx.drawImage(coverImg, (W - dw) / 2, (H - dh) / 2, dw, dh, 0, 0, sc.width, sc.height);
        // logo 区域约模板坐标 x 40~250、y 30~95，按同比例采样
        const d = sctx.getImageData(0, 0, Math.round((300 * 250) / W), Math.round((sc.height * 95) / H)).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) {
          sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }
        const luma = sum / (d.length / 4);
        return luma > 150 ? '#111827' : '#ffffff';
      } catch {
        return '#ffffff';
      }
    })();
    // 注入背景层：优先真实封面（铺满 A3 画板居中裁切）；无封面时用深色底填充。
    // 模板中的设计稿背景大图已剔除，插入到裁剪分组内避免封面溢出画板
    const bgLayer = coverDataUrl
      ? `<image width="1190.55" height="841.89" preserveAspectRatio="xMidYMid slice" href="${coverDataUrl}" xlink:href="${coverDataUrl}"/>`
      : `<rect width="1190.55" height="841.89" fill="#1a1d23"/>`;
    if (template) {
      template = template.replace(
        /<g style="clip-path: url\(#clippath\);">/u,
        (m0) => m0 + bgLayer
      );
      // 左上角 logo（图标+字标为单一 path，模板无 fill 默认黑色）注入自适应颜色
      template = template.replace(
        /<path d="M74\.93,63\.57/u,
        `<path fill="${logoFill}" d="M74.93,63.57`
      );
    }
    const fontStack = "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', Arial, sans-serif";
    // 标题区（原模板 y 574~599，白字，实测字号约 32）：蓝色方块标记 + 标题文字
    const titleBaseY = 600;
    const titleSvg =
      `<rect x="21.47" y="${titleBaseY - 27}" width="27.28" height="27.28" style="fill: #3554f4; opacity: .87;"/>` +
      titleLines
        .map(
          (line, idx) =>
            `<text x="62" y="${titleBaseY + idx * 44}" fill="#ffffff" font-size="32" font-weight="800" font-family="${fontStack}">${safe(line)}</text>`
        )
        .join('\n  ');
    // 简介区（原模板 y 638~717，实测字号约 24，行距约 40，深色字适配底部白色渐隐）
    const introStartY = titleLines.length > 1 ? 692 : 664;
    const introSvg = introLines
      .map(
        (line, idx) =>
          `<text x="62" y="${introStartY + idx * 40}" fill="#1f2937" font-size="24" font-family="${fontStack}">${safe(line)}</text>`
      )
      .join('\n  ');
    // 二维码白卡（原模板位置 978,555 尺寸 171×171）：真实二维码替换模板占位灰块
    const qrCardCenterX = 978.12 + 171.54 / 2;
    const qrCardSvg = qrSvg
      ? `
  <g>
    <rect x="978.12" y="555.08" width="171.54" height="171.54" rx="4.77" fill="#ffffff"/>
    <g transform="translate(987.65, 564.61)"><svg xmlns="http://www.w3.org/2000/svg" width="152.48" height="152.48" viewBox="${qrViewBox}"${qrSvg.slice('<svg'.length)}</g>
    <text x="${qrCardCenterX}" y="757" text-anchor="middle" fill="#4b5563" font-size="22" font-family="${fontStack}">扫码浏览作品</text>
    <text x="${qrCardCenterX}" y="800" text-anchor="middle" fill="#111827" font-size="28" font-weight="800" font-family="${fontStack}">@${safe(authorLine)}</text>
  </g>`
      : '';
    // 将动态内容叠加到模板上；模板加载失败时降级为纯色底
    const baseSvg =
      template ||
      `<svg xmlns="http://www.w3.org/2000/svg" width="1190.55" height="841.89" viewBox="0 0 1190.55 841.89"><rect width="1190.55" height="841.89" fill="#0b1c3f"/></svg>`;
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
    // 创建打印窗口，A3 横版尺寸
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${work.name} - TRAE 创造力大赛</title>
          <style>
            @page {
              size: A3 landscape;
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
      // 与模板 viewBox 同比例（1190.55×841.89 即 A3 横版，约 96dpi）
      canvas.width = 1191;
      canvas.height = 842;
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
        className="inline-flex items-center text-gray-400 hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {getBackButtonLabel()}
      </button>

      {/* 封面区 - 精简 */}
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="aspect-video w-full bg-zinc-900 relative group">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{work.name}</h1>
          <p className="text-gray-300 text-base leading-relaxed">{work.intro}</p>
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
                  <span key={tag} className="bg-zinc-800 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-700">
                    #{tag}
                  </span>
                ))}
              </div>
              {/* 第二行：信息 */}
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
                {(work.country || work.city) && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-200">{[work.country, work.city].filter(Boolean).join(' / ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleLike}
                className={`gap-2 transition-all duration-300 px-6 py-2.5 rounded-full font-medium ${
                  liked
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-[0_0_20px_rgba(50,240,140,0.4)] border-transparent scale-105"
                    : "bg-zinc-800/80 text-gray-300 hover:text-white hover:bg-zinc-800 border border-white/10 backdrop-blur-md hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(50,240,140,0.1)]"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 transition-transform ${liked ? "fill-current" : ""} ${likeAnimating ? "scale-125" : "scale-100"}`} />
                {liked ? t('liked') : t('likeProject')}
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${liked ? "bg-white/20" : "bg-white/5 text-gray-400 group-hover:text-white"}`}>
                  {likesCount}
                </span>
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('story')}
            </h2>
            <div
              className="prose prose-invert max-w-none leading-relaxed prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-gray-300 prose-blockquote:text-gray-400 prose-code:text-primary"
              dangerouslySetInnerHTML={{ __html: work.story || '<p>-</p>' }}
            />
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('features')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureLines.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('scenarios')}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {scenarioLines.map((scenario, index) => (
                <div key={`${scenario}-${index}`} className="flex items-start gap-4 bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 ring-4 ring-primary/10"></div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{scenario}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card p-8 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              {t('screenshots')}
            </h2>
            {screenshotList.length > 0 ? (
              <div className="space-y-4">
                <div
                  ref={screenshotCarouselRef}
                  tabIndex={0}
                  className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 group outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
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
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-3">
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

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
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
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700 hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 border border-zinc-600 hover:border-primary transition-colors">
                      {work.author.name?.charAt(0) || '?'}
                    </div>
                  )}
                </Link>
                <div>
                  <Link
                    href={`/user/${work.author.id}`}
                    className="text-sm text-gray-200 font-medium hover:text-primary transition-colors"
                  >
                    {work.author.name || '-'}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{work.author.bio || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                {emailList.map((email) => (
                  <div key={email} className="flex items-center gap-2 text-sm text-gray-400 mb-2">
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
                        <span key={member} className="bg-zinc-800 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-700">
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
      <div className="mt-8 pt-6 border-t border-zinc-800/50">
        <p className="text-center text-xs text-gray-500">{t('aboutProjectDesc')}</p>
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
                <img src={shareImageUrl} alt={t('sharePreviewAlt')} className="w-full aspect-[1190.55/841.89] object-cover" />
              ) : (
                <div className="h-56 flex flex-col items-center justify-center gap-3 text-zinc-500">
                  {isShareGenerating ? (
                    <>
                      <div className="w-48 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-[shareProgress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs">{t('shareGenerating')}</span>
                    </>
                  ) : '-'}
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
            <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10" onClick={handlePrintPoster} disabled={!shareImageUrl || isShareGenerating}>
              <Printer className="w-4 h-4" />
              {t('printPoster') || '打印海报'}
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
      {/* 轻量级图片预览 */}
      {isImagePreviewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
          
          {previewImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showPrevPreviewImage(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showNextPreviewImage(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                aria-label="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          <img
            src={previewImages[previewImageIndex]}
            alt={`${previewTitle}-${previewImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {previewImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
              <span className="text-white text-sm">{previewImageIndex + 1} / {previewImages.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
