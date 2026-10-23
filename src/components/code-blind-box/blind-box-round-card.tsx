'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { blindBoxAssets } from '@/lib/code-blind-box';
import type { BlindBoxDraw } from '@/lib/code-blind-box/types';

type BlindBoxRoundCardProps = {
  draw: BlindBoxDraw;
  roundLabel: string;
  pickHint: string;
  selectedHint: string;
  selected: boolean;
  onSelect: () => void;
};

export function BlindBoxRoundCard({
  draw,
  roundLabel,
  pickHint,
  selectedHint,
  selected,
  onSelect,
}: BlindBoxRoundCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex h-[220px] w-full max-w-[392px] flex-col gap-4 overflow-hidden rounded-xl border px-6 pb-5 pt-6 text-left transition-all',
        selected
          ? 'border-[#32f08c] bg-gradient-to-br from-[#191f25] to-[#040709]'
          : 'border-[#1f262d] bg-gradient-to-br from-[#313a42] to-[#4a5866] hover:border-[#32f08c]/40'
      )}
    >
      <Image
        src={blindBoxAssets.roundCardTexture}
        alt=""
        fill
        className="pointer-events-none object-cover opacity-80"
        sizes="400px"
      />
      <div className="relative z-[1] flex items-center justify-between">
        <span className="text-sm font-medium text-[#f6f8f5]">
          <span className="font-[family-name:var(--font-sans)] text-[1.08em]">
            {roundLabel}
          </span>
        </span>
        <span className="relative h-6 w-6 shrink-0">
          <Image
            src={
              selected
                ? blindBoxAssets.radioSelected
                : blindBoxAssets.radioEmpty
            }
            alt=""
            width={24}
            height={24}
            className="h-full w-full"
          />
        </span>
      </div>
      <div className="relative z-[1] flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-[#cbfdfd] px-3.5 py-1.5 text-lg font-medium text-[#1f221b]">
            {draw.themeWord}
          </span>
          <span className="rounded-lg bg-[#78ccfc] px-3.5 py-1.5 text-lg font-medium text-[#1f221b]">
            {draw.functionWord}
          </span>
        </div>
        <span className="inline-flex w-fit rounded-lg bg-[#9dffc8] px-3.5 py-1.5 text-lg font-medium text-[#1f221b]">
          {draw.styleWord}
        </span>
      </div>
      <p
        className={cn(
          'relative z-[1] text-xs leading-[18px]',
          selected ? 'text-[#32f08c]' : 'text-[#a9b3ae]'
        )}
      >
        {selected ? selectedHint : pickHint}
      </p>
    </button>
  );
}
