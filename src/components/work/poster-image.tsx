'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { buildPosterDataUrl, POSTER_H, POSTER_W } from '@/lib/poster';
import { cn } from '@/lib/utils';
import { RemoteImage } from '@/components/common/remote-image';

interface PosterImageProps {
  nickname: string;
  description?: string | null;
  imageUrl: string;
  demoUrl: string;
  className?: string;
  /** 二维码区提示文案（可传入翻译文案） */
  qrText?: string;
  fallbackTitle?: string;
  anonymousLabel?: string;
  /**
   * cover：列表缩略图，浏览器直链 COS，避免 cover-proxy + SVG 合成
   * composed：详情/制作页完整海报（默认）
   */
  variant?: 'cover' | 'composed';
}

function PosterCoverImage({
  nickname,
  imageUrl,
  className,
}: Pick<PosterImageProps, 'nickname' | 'imageUrl' | 'className'>) {
  if (!imageUrl) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted text-muted-foreground text-xs', className)}
        style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
      >
        {nickname}
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full', className)}
      style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
    >
      <RemoteImage
        src={imageUrl}
        alt={nickname}
        fill
        sizes="(max-width: 768px) 50vw, 280px"
        className="object-cover"
      />
    </div>
  );
}

function PosterComposedImage({
  nickname,
  description,
  imageUrl,
  demoUrl,
  className,
  qrText,
  fallbackTitle,
  anonymousLabel,
}: Omit<PosterImageProps, 'variant'>) {
  const [dataUrl, setDataUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl('');
    setFailed(false);

    buildPosterDataUrl(imageUrl, {
      nickname,
      description,
      demoUrl,
      qrText,
      fallbackTitle,
      anonymousLabel,
    })
      .then(url => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [nickname, description, imageUrl, demoUrl, qrText, fallbackTitle, anonymousLabel]);

  if (failed) {
    return (
      <img src={imageUrl} alt={nickname} className={cn('w-full h-full object-cover', className)} />
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted', className)}
        style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
      >
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={nickname}
      className={cn('w-full h-full object-cover', className)}
      style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
    />
  );
}

/**
 * 海报展示：列表用 cover，详情/管理预览用 composed 完整合成。
 */
export function PosterImage({ variant = 'composed', ...props }: PosterImageProps) {
  if (variant === 'cover') {
    return <PosterCoverImage nickname={props.nickname} imageUrl={props.imageUrl} className={props.className} />;
  }
  return <PosterComposedImage {...props} />;
}
