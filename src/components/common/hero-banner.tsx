"use client";

import React from "react";
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * 首页 Banner：设计稿原图（含标题/标语，仅剔除静态按钮图形）横向铺满浏览器宽度。
 * 背景图为设计稿 SVG 光栅化产物，见 public/images/banner-bg.jpg（viewBox 979.42×419.75，21:9）。
 * 两个真实交互按钮按设计稿按钮坐标（百分比）绝对定位叠加，还原原位点击体验。
 */

// 设计稿按钮坐标（viewBox 979.42×419.75）换算为百分比
const SUBMIT_BTN = { left: 330.91 / 979.42, top: 297.85 / 419.75, width: 171.07 / 979.42, height: 43.38 / 419.75 };
const BROWSE_BTN = { left: 524.03 / 979.42, top: 297.85 / 419.75, width: 124.57 / 979.42, height: 43.38 / 419.75 };

export function HeroBanner({ onBrowseWorks }: { onBrowseWorks?: () => void }) {
  const t = useTranslations('Home');
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmitClick = () => {
    // 未登录先去登录，登录后回到提交页
    router.push(session ? `/${locale}/submit` : `/${locale}/sign-in`);
  };

  return (
    <section
      className="relative w-screen overflow-hidden -mt-8"
      style={{ marginLeft: 'calc(50% - 50vw)' }}
    >
      {/* 标题/标语都在设计稿图内，仅对屏幕阅读器提供语义 */}
      <h1 className="sr-only">{t('heroTitle')}</h1>

      {/* 背景图横向铺满：容器保持设计稿 979.42×419.75（21:9）比例，图片不裁切不变形 */}
      <div className="relative aspect-[979.42/419.75]">
        <img
          src="/images/banner-bg.jpg"
          alt={t('heroTitle')}
          className="absolute inset-0 h-full w-full object-fill"
        />

        {/* 底部黑色渐变：平滑过渡到下方作品区，避免硬切边 */}
        <div
          className="absolute inset-x-0 bottom-0 h-[26%] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }}
        />

        {/* 真实按钮：提交我的作品 + 浏览作品 */}
        {/* 桌面端：按设计稿百分比绝对定位 */}
        <button
          onClick={() => router.push(`/${locale}/poster-maker`)}
          className="hidden sm:flex absolute items-center justify-center gap-[0.4em] rounded-full font-bold text-white transition-all hover:brightness-110 hover:scale-[1.04] text-[clamp(11px,1.5vw,24px)]"
          style={{
            left: `${SUBMIT_BTN.left * 100}%`,
            top: `${SUBMIT_BTN.top * 100}%`,
            width: `${SUBMIT_BTN.width * 100}%`,
            height: `${SUBMIT_BTN.height * 100}%`,
            background: '#4b3fe3',
            boxShadow: '0 4px 0 0 #32f08e, 0 10px 24px rgba(50, 240, 142, 0.55)',
          }}
        >
          {t('makePoster')}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>

        <button
          onClick={onBrowseWorks}
          className="hidden sm:flex absolute items-center justify-center rounded-full font-bold text-white transition-all hover:brightness-125 hover:scale-[1.04] text-[clamp(11px,1.5vw,24px)]"
          style={{
            left: `${BROWSE_BTN.left * 100}%`,
            top: `${BROWSE_BTN.top * 100}%`,
            width: `${BROWSE_BTN.width * 100}%`,
            height: `${BROWSE_BTN.height * 100}%`,
            background: '#000335',
          }}
        >
          {t('browseWork')}
        </button>

        {/* 移动端：底部居中，自然尺寸 */}
        <div className="sm:hidden absolute bottom-[14%] left-0 right-0 flex items-center justify-center gap-2 px-4">
          <button
            onClick={() => router.push(`/${locale}/poster-maker`)}
            className="flex items-center justify-center gap-1 rounded-full font-bold text-white text-xs px-4 py-2 transition-all active:scale-95"
            style={{
              background: '#4b3fe3',
              boxShadow: '0 3px 0 0 #32f08e, 0 8px 20px rgba(50, 240, 142, 0.45)',
            }}
          >
            {t('makePoster')}
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
          <button
            onClick={onBrowseWorks}
            className="flex items-center justify-center rounded-full font-bold text-white text-xs px-4 py-2 transition-all active:scale-95"
            style={{ background: '#000335' }}
          >
            {t('browseWork')}
          </button>
        </div>
      </div>
    </section>
  );
}
