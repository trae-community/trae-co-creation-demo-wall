'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { blindBoxAssets } from '@/lib/code-blind-box';
import type { BlindBoxDimension } from '@/lib/code-blind-box/words';

const DIMENSION_META: Record<
  BlindBoxDimension,
  {
    label: string;
    index: string;
    keycap: string;
    glow: string;
    letterImg: string;
  }
> = {
  theme: {
    label: '主题词',
    index: '01',
    ...blindBoxAssets.keycap.theme,
  },
  function: {
    label: '功能词',
    index: '02',
    ...blindBoxAssets.keycap.function,
  },
  style: {
    label: '风格词',
    index: '03',
    ...blindBoxAssets.keycap.style,
  },
};

const PARTICLE_STRIPS = blindBoxAssets.particles;

type BlindBoxCardProps = {
  dimension: BlindBoxDimension;
  word?: string;
  flipped: boolean;
  disabled?: boolean;
  shaking?: boolean;
  onFlip: () => void;
};

export function BlindBoxCard({
  dimension,
  word,
  flipped,
  disabled,
  shaking,
  onFlip,
}: BlindBoxCardProps) {
  const meta = DIMENSION_META[dimension];
  const letterSize =
    dimension === 'function' ? 'h-[51px] w-[41px]' : dimension === 'style' ? 'h-[51px] w-[44px]' : 'h-[51px] w-[51px]';

  return (
    <button
      type="button"
      disabled={disabled || (flipped && !word)}
      onClick={onFlip}
      className={cn(
        'group relative mx-auto h-[288px] w-[216px] max-w-full shrink-0 [perspective:1200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32f08c] rounded-xl',
        !flipped && !disabled && 'cursor-pointer',
        shaking && 'animate-blind-box-shake'
      )}
      aria-label={flipped ? word : meta.label}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]'
        )}
      >
        {/* Back — Figma Face=Back */}
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-xl [backface-visibility:hidden]',
            !flipped && 'group-hover:-translate-y-0.5 transition-transform'
          )}
        >
          {PARTICLE_STRIPS.map((src, i) => (
            <div key={src} className="absolute left-0 right-0 h-[72px] overflow-hidden" style={{ top: i * 72 }}>
              <Image src={src} alt="" fill className="object-cover" sizes="216px" />
            </div>
          ))}
          <div className="absolute left-1/2 top-[25px] h-3 w-[46px] -translate-x-1/2">
            <Image src={blindBoxAssets.traeLogoBack} alt="" width={46} height={12} className="h-full w-full" />
          </div>
          <div className="absolute inset-x-0 top-[72px] bottom-[36px] flex flex-col items-center justify-center gap-2">
            <div className={cn('relative mix-blend-screen', letterSize)}>
              <Image src={meta.letterImg} alt="" fill className="object-contain" sizes="51px" />
            </div>
            <p className="text-center text-[26px] font-bold leading-9 text-[#f6f8f5]">{meta.label}</p>
          </div>
          <p className="absolute bottom-3 left-0 w-full text-center text-[10px] font-medium leading-[14px] text-[#f6f8f5]/90">
            · 点击翻开 ·
          </p>
        </div>

        {/* Front — Figma Face=Front */}
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-xl bg-white [backface-visibility:hidden] [transform:rotateY(180deg)]',
            flipped && 'animate-blind-box-reveal-pop'
          )}
        >
          <div className="absolute left-1/2 top-[21px] h-3 w-[46px] -translate-x-1/2">
            <Image src={blindBoxAssets.traeLogo} alt="TRAE" width={46} height={12} className="h-full w-full" />
          </div>
          <p className="absolute inset-x-0 top-[53px] px-3 text-center text-[26px] font-bold leading-9 text-[#1f221b] [overflow-wrap:anywhere]">
            {word}
          </p>
          <div className="absolute left-1/2 top-[101px] h-32 w-[182px] -translate-x-1/2">
            <div
              className={cn(
                'absolute h-[57px] w-[102px]',
                dimension === 'style' ? 'left-[39px] top-[50px]' : 'left-[34px] top-[44px]'
              )}
            >
              <Image src={meta.glow} alt="" width={102} height={57} className="h-full w-full" />
            </div>
            <div className="absolute left-1/2 top-[18px] h-[92px] w-[104px] -translate-x-1/2">
              <Image src={meta.keycap} alt="" width={104} height={92} className="h-full w-full object-contain" />
            </div>
          </div>
          <p
            className="absolute inset-x-0 bottom-[15px] flex items-baseline justify-center gap-1 text-[10px] font-medium leading-[14px] text-[#66706d]"
          >
            <span>{meta.label}</span>
            <span className="font-[family-name:var(--font-sans)] font-medium tabular-nums tracking-[0.02em]">
              {meta.index}
            </span>
          </p>
        </div>
      </div>
    </button>
  );
}

export function dimensionAccentClass(dimension: BlindBoxDimension): string {
  if (dimension === 'theme') return 'text-[#0d9488]';
  if (dimension === 'function') return 'text-[#0284c7]';
  return 'text-[#7c3aed]';
}
