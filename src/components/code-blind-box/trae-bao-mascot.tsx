'use client';

import Image from 'next/image';
import { blindBoxAssets } from '@/lib/code-blind-box';
import { cn } from '@/lib/utils';

type TraeBaoMascotVariant = 'invite' | 'selected';

type TraeBaoMascotProps = {
  className?: string;
  /** invite: Asset/mascotInvite；selected: Asset/mascotSelected（手持「已锁定」牌） */
  variant?: TraeBaoMascotVariant;
};

const MASCOT_ASSET: Record<
  TraeBaoMascotVariant,
  { src: string; width: number; height: number }
> = {
  invite: {
    src: blindBoxAssets.mascotInvite,
    width: 165,
    height: 160,
  },
  selected: {
    src: blindBoxAssets.mascotSelected,
    width: 165,
    height: 160,
  },
};

/** Figma「Asset / mascotInvite|mascotSelected / 用户定稿」165×160 */
export function TraeBaoMascot({ className, variant = 'invite' }: TraeBaoMascotProps) {
  const asset = MASCOT_ASSET[variant];
  return (
    <div
      className={cn(
        'relative mx-auto h-[160px] w-[165px] select-none pointer-events-none',
        className
      )}
      aria-hidden
    >
      <div className="relative h-full w-full animate-trae-bao-float">
        <Image
          src={asset.src}
          alt=""
          width={asset.width}
          height={asset.height}
          className="h-full w-full object-contain object-bottom"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
