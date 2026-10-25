'use client';

import Image from 'next/image';
import { useEffect, useState, type MouseEventHandler } from 'react';
import { cn } from '@/lib/utils';

export type RemoteImageProps = {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  /** 父容器需 `position: relative` 且设好宽高或 aspect */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onClick?: MouseEventHandler<HTMLImageElement>;
  title?: string;
};

function resolveSrc(src?: string | null, fallback?: string) {
  const value = (src || fallback || '').trim();
  return value || null;
}

/**
 * 远程/本地图片：next/image + 懒加载 + sizes；与 standalone 部署一致使用 unoptimized。
 */
export function RemoteImage({
  src,
  alt,
  fallbackSrc,
  className,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  onClick,
  title,
}: RemoteImageProps) {
  const [activeSrc, setActiveSrc] = useState(() => resolveSrc(src, fallbackSrc));
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setActiveSrc(resolveSrc(src, fallbackSrc));
    setExhausted(false);
  }, [src, fallbackSrc]);

  if (!activeSrc || exhausted) {
    return null;
  }

  const handleError = () => {
    if (fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc);
      return;
    }
    setExhausted(true);
  };

  const shared = {
    alt,
    title,
    onClick,
    onError: handleError,
    priority,
    unoptimized: true,
    className: cn(className, onClick && 'cursor-pointer'),
    sizes: sizes ?? (fill ? '(max-width: 768px) 100vw, 33vw' : undefined),
  };

  if (fill) {
    return <Image src={activeSrc} fill {...shared} />;
  }

  const w = width ?? 400;
  const h = height ?? 300;

  return <Image src={activeSrc} width={w} height={h} {...shared} />;
}
