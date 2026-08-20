'use client'

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PlusCircle, Home, LogIn, Languages, Check, LayoutDashboard, UserRound, Menu, X, Trophy, Github, Code2, Globe, MessagesSquare, MessageSquarePlus, Palette } from "lucide-react";
import { ParticlesBackground } from "./particles-background";
import { BackToTop } from "@/components/common/back-to-top";
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/lib/language/navigation';
import Image from 'next/image';
import logo from '@/assets/logo.svg';

const LOCALE_OPTIONS = [
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
] as const;

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const tProfile = useTranslations('Profile');
  const tFooter = useTranslations('Footer');
  const locale = useLocale();
  const router = useRouter();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user roles from API
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const profileRoles: string[] = (data?.profile?.roles ?? []).map(
          (r: { roleCode: string }) => r.roleCode
        );
        if (profileRoles.length > 0) setRoles(profileRoles);
        setAvatarUrl(data?.profile?.avatarUrl ?? null);
      })
      .catch(() => {});
  }, [status]);

  const isAuthenticated = status === 'authenticated';
  // 控制台菜单需要登录且有权限
  const showConsole = isAuthenticated && roles.some(r => r === 'root' || r === 'admin');

  // 点击提交作品按钮时判断登录状态
  const handleSubmitClick = () => {
    if (isAuthenticated) {
      router.push('/submit');
    } else {
      router.push('/sign-in');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 导航栏滚动反馈：滚动后加深背景 + 加阴影
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageSwitch = (newLocale: (typeof LOCALE_OPTIONS)[number]['code']) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
    setLangMenuOpen(false);
  };

  const currentOption = LOCALE_OPTIONS.find(o => o.code === locale) ?? LOCALE_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground relative z-0 overflow-x-clip">
      <ParticlesBackground />
      <header className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "top-2 mx-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          : "top-0 bg-background backdrop-blur-xl border-b border-white/5"
      )}>
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight group">
            <Image src={logo} alt="logo" className="w-8 h-8" />
            <span className="hidden sm:inline truncate">TRAE DEMO WALL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-md">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Home className="w-3.5 h-3.5" />
              {t('home')}
            </Link>
            <Link
              href="/rankings"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/rankings"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              {t('rankings')}
            </Link>
            <button
              type="button"
              onClick={handleSubmitClick}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/submit"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {t('submit')}
            </button>
            <Link
              href="/poster-maker"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/poster-maker"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Palette className="w-3.5 h-3.5" />
              {t('posterMaker')}
            </Link>

            {showConsole && (
              <Link
                href="/console"
                prefetch={false}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  pathname && pathname.startsWith("/console")
                    ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('console')}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  pathname === "/profile"
                    ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <UserRound className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  )}
                </div>
                {tProfile('menu')}
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                href="/sign-in"
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  pathname === "/sign-in"
                    ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('login')}
              </Link>
            )}

            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5"
              >
                <Languages className="w-3.5 h-3.5" />
                {currentOption.label}
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                  {LOCALE_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => handleLanguageSwitch(option.code)}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors",
                        option.code === locale
                          ? "text-green-500 bg-green-500/10"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base">{option.flag}</span>
                        {option.label}
                      </span>
                      {option.code === locale && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Home className="w-4 h-4" />
                {t('home')}
              </Link>
              <Link
                href="/rankings"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/rankings"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Trophy className="w-4 h-4" />
                {t('rankings')}
              </Link>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); handleSubmitClick(); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/submit"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <PlusCircle className="w-4 h-4" />
                {t('submit')}
              </button>
              <Link
                href="/poster-maker"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/poster-maker"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Palette className="w-4 h-4" />
                {t('posterMaker')}
              </Link>

              {showConsole && (
                <Link
                  href="/console"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname && pathname.startsWith("/console")
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('console')}
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === "/profile"
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  {tProfile('menu')}
                </Link>
              )}

              {!isAuthenticated && (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === "/sign-in"
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  {t('login')}
                </Link>
              )}

              <div className="pt-2 border-t border-white/5">
                <p className="px-4 py-2 text-xs text-gray-500">{t('language') || 'Language'}</p>
                {LOCALE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => {
                      handleLanguageSwitch(option.code);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm transition-all",
                      option.code === locale
                        ? "text-green-500 bg-green-500/10 border border-green-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{option.flag}</span>
                      {option.label}
                    </span>
                    {option.code === locale && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 pt-20 pb-8">
        {children}
      </main>

      <BackToTop />

      <footer className="relative border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {/* 顶部渐变装饰线 — 科技感点缀 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-40 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
        <div className="container mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* 版权 + 备案 */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-zinc-500">
            <span>{tFooter('rights')}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block" />
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              {tFooter('icp')}
            </a>
          </div>

          {/* 外链 — 胶囊风格，与导航/筛选 UI 一致 */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {[
              { label: tFooter('feedback'), href: 'https://github.com/trae-community/trae-co-creation-demo-wall/issues', icon: MessageSquarePlus },
              { label: tFooter('githubCommunity'), href: 'https://github.com/trae-community', icon: Github },
              { label: tFooter('traeOfficial'), href: 'https://www.trae.cn', icon: Globe },
              { label: tFooter('traeCommunity'), href: 'https://forum.trae.cn', icon: MessagesSquare },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-zinc-400 border border-white/10 bg-white/5 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10 transition-all whitespace-nowrap"
              >
                <Icon className="w-3 h-3" />
                <span className="sm:inline">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
