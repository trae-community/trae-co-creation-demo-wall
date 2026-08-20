'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { buildPosterDataUrl, POSTER_W, POSTER_H } from '@/lib/poster-svg';
import { cn } from '@/lib/utils';

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
}

/**
 * 最终海报渲染组件：封面 + 昵称 + 简介 + 二维码合成竖版海报。
 * 渲染失败时降级为原始封面图，保证展示不空白。
 */
export function PosterImage({
  nickname,
  description,
  imageUrl,
  demoUrl,
  className,
  qrText,
  fallbackTitle,
  anonymousLabel,
}: PosterImageProps) {
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
    // 降级：直接展示原始封面
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={nickname} className={cn('w-full h-full object-cover', className)} />
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={cn('flex items-center justify-center bg-white/5', className)}
        style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
      >
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={nickname}
      className={cn('w-full h-full object-cover', className)}
      style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
    />
  );
}
