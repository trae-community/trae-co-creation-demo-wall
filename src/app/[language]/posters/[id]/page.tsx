'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/language/navigation';
import { ArrowLeft, ExternalLink, Download, Calendar, Loader2 } from 'lucide-react';
import { PosterImage } from '@/components/work/poster-image';
import { buildPosterDataUrl, downloadPosterPng } from '@/lib/poster-svg';
import { Button } from '@/components/ui/button';

interface PosterDetail {
  id: string;
  nickname: string;
  description: string | null;
  imageUrl: string;
  demoUrl: string;
  auditStatus: number;
  createdAt: string;
}

export default function PosterDetailPage() {
  const t = useTranslations('Posters');
  const locale = useLocale();
  const params = useParams();
  const id = params?.id as string;

  const [poster, setPoster] = useState<PosterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const res = await fetch(`/api/posters/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPoster(data);
        }
      } catch {
        // Error handled
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchPoster();
  }, [id]);

  // 生成二维码
  useEffect(() => {
    if (!poster?.demoUrl) return;
    const generateQr = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(poster.demoUrl, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch {
        // QR generation failed silently
      }
    };
    generateQr();
  }, [poster?.demoUrl]);

  // 下载最终合成海报（封面 + 昵称 + 简介 + 二维码）
  const handleDownload = async () => {
    if (!poster || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await buildPosterDataUrl(poster.imageUrl, {
        nickname: poster.nickname,
        description: poster.description,
        demoUrl: poster.demoUrl,
        qrText: t('scanToExperience'),
        fallbackTitle: poster.nickname,
        anonymousLabel: poster.nickname,
      });
      await downloadPosterPng(dataUrl, `poster-${poster.nickname}.png`);
    } catch {
      // Download failed silently
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!poster) {
    return (
      <div className="max-w-md mx-auto text-center py-24 rounded-2xl border border-dashed border-border bg-card">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Link href="/posters" className="inline-flex items-center gap-2 mt-4 text-green-500 hover:text-green-400 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {t('backToGallery')}
        </Link>
      </div>
    );
  }

  const dateStr = new Date(poster.createdAt).toLocaleDateString(
    locale === 'zh-CN' ? 'zh-CN' : locale === 'ja-JP' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link href="/posters" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t('backToGallery')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧：最终合成海报（封面 + 昵称 + 简介 + 二维码） */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-lg">
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '283.46/425.2' }}>
              <PosterImage
                nickname={poster.nickname}
                description={poster.description}
                imageUrl={poster.imageUrl}
                demoUrl={poster.demoUrl}
                qrText={t('scanToExperience')}
                fallbackTitle={poster.nickname}
                anonymousLabel={poster.nickname}
              />
            </div>
          </div>
        </div>

        {/* 右侧：信息面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 作者信息卡片 */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h1 className="text-xl font-bold text-foreground mb-2">{poster.nickname}</h1>
            {poster.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{poster.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <Calendar className="w-4 h-4" />
              <span>{t('createdAt')}：</span>
              {dateStr}
            </div>
          </div>

          {/* 二维码 + Demo 链接 */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">{t('scanToExperience')}</h3>
            {qrDataUrl && (
              <div className="bg-white rounded-xl p-3 w-fit">
                <img src={qrDataUrl} alt={t('qrCode')} className="w-32 h-32" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('demoLink')}</p>
              <a
                href={poster.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-green-500 hover:text-green-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{poster.demoUrl}</span>
              </a>
            </div>
          </div>

          {/* 下载按钮（统一使用 Button 组件） */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-11 rounded-md"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('downloadPoster')}
          </Button>
        </div>
      </div>
    </div>
  );
}
