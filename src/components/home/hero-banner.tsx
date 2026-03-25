"use client";

import React, { useRef, useState } from "react";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Link } from '@/lib/language/navigation';
import { useTranslations } from 'next-intl';

export function HeroBanner() {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Home');

  return (
    <section
      ref={containerRef}
      className="relative rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-16 text-white overflow-hidden border border-white/15 shadow-2xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 z-0" style={{ background: '#0d1117' }} />

      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.3) 50%,rgba(34,197,94,0.05) 100%)'
        }}
      />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4 md:mb-6" style={{ backgroundColor: 'rgba(50, 240, 140, 0.1)', borderColor: 'rgba(50, 240, 140, 0.2)', border: '1px solid', color: '#32F08C' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#32F08C' }} />
          {t('heroBadge') || '在这里，看见全国各地用户的 TRAE 创作作品'}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-5 tracking-tight leading-tight">
          {t('heroTitle')}{' '}
          <span style={{ color: '#32F08C' }}>TRAE</span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 mb-6 md:mb-8 max-w-lg leading-relaxed">
          {t('heroSubtitle1')}{' '}
          <span className="font-semibold text-zinc-200">{t('heroSubtitleTRAE')}</span>.{' '}
          {t('heroSubtitle2')}{' '}
          <span className="font-semibold text-zinc-200">{t('heroSubtitleFriends')}</span>.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href="/submit"
            className="px-5 md:px-6 py-2.5 md:py-3 rounded-full font-bold text-sm text-black flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: '#32F08C', boxShadow: '0 0 20px rgba(50, 240, 140, 0.3)' }}
          >
            {t('submitWork')}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <a
            href="#projects"
            className="px-5 md:px-6 py-2.5 md:py-3 rounded-full font-semibold text-sm text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md text-center"
          >
            {t('browseWork')}
          </a>
        </div>
      </div>

      <div
        className="absolute top-1/2 right-0 pointer-events-none z-0"
        style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', transform: 'translate(30%, -50%)' }}
      />

      <DottedGlowBackground
        className="pointer-events-none"
        opacity={0.8}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        highlightColor="#32F08C"
        highlightPercentage={0.08}
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={isHovering ? 1.5 : 0.5}
      />
    </section>
  );
}
