'use client'

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PlusCircle, Home, LogIn, Languages, Check, LayoutDashboard, UserRound, Menu, X } from "lucide-react";
import { ParticlesBackground } from "./particles-background";
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
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
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Read roles from local JWT — zero network call in the happy path
  const { sessionClaims, userId: clerkUserId } = useAuth();
  const jwtRoles = (sessionClaims?.publicMetadata as { roles?: string[] })?.roles ?? [];
  const [fallbackRoles, setFallbackRoles] = useState<string[]>([]);

  // Fallback: if JWT has no roles but user is logged in (webhook not yet fired / JWT not refreshed),
  // fetch once from /api/profile to get roles from DB.
  useEffect(() => {
    if (!clerkUserId || jwtRoles.length > 0) return;
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const profileRoles: string[] = (data?.profile?.roles ?? []).map(
          (r: { roleCode: string }) => r.roleCode
        );
        if (profileRoles.length > 0) setFallbackRoles(profileRoles);
      })
      .catch(() => {});
  }, [clerkUserId, jwtRoles.length]);

  const roles = jwtRoles.length > 0 ? jwtRoles : fallbackRoles;
  const showConsole = roles.some(r => r === 'root' || r === 'admin');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSwitch = (newLocale: (typeof LOCALE_OPTIONS)[number]['code']) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
    setLangMenuOpen(false);
  };

  const currentOption = LOCALE_OPTIONS.find(o => o.code === locale) ?? LOCALE_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground relative z-0">
      <ParticlesBackground />
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/15">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="group flex items-center gap-3 text-lg font-bold tracking-tight text-white">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(122,255,190,0.18),transparent_55%)]" />
              <Image src={logo} alt="logo" className="relative z-10 w-7 h-7" />
            </div>
            <span className="hidden sm:inline font-display truncate bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl text-transparent transition-all group-hover:to-emerald-200">
              TRAE Demo Wall
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                pathname === "/"
                  ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Home className="w-3.5 h-3.5" />
              {t('home')}
            </Link>
            <Link
              href="/submit"
              prefetch={false}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                pathname === "/submit"
                  ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {t('submit')}
            </Link>

            {showConsole && (
              <Link
                href="/console"
                prefetch={false}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  pathname && pathname.startsWith("/console")
                    ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('console')}
              </Link>
            )}

            <SignedIn>
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  pathname === "/profile"
                    ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <UserRound className="w-3.5 h-3.5" />
                {tProfile('menu')}
              </Link>
            </SignedIn>

            <SignedOut>
              <Link
                href="/sign-in"
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  pathname === "/sign-in"
                    ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('login')}
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2 px-3 py-1">
                <UserButton />
              </div>
            </SignedIn>

            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <Languages className="w-3.5 h-3.5" />
                {currentOption.label}
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/92 py-1 shadow-2xl backdrop-blur-xl">
                  {LOCALE_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => handleLanguageSwitch(option.code)}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors",
                        option.code === locale
                          ? "bg-emerald-300/10 text-emerald-200"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
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
            <SignedIn>
              <UserButton />
            </SignedIn>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
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
                    ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Home className="w-4 h-4" />
                {t('home')}
              </Link>
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/submit"
                    ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <PlusCircle className="w-4 h-4" />
                {t('submit')}
              </Link>

              {showConsole && (
                <Link
                  href="/console"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname && pathname.startsWith("/console")
                      ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('console')}
                </Link>
              )}

              <SignedIn>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === "/profile"
                      ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <UserRound className="w-4 h-4" />
                  {tProfile('menu')}
                </Link>
              </SignedIn>

              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === "/sign-in"
                      ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  {t('login')}
                </Link>
              </SignedOut>

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
                        ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
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

      <main className="container mx-auto flex-1 px-4 py-8 md:py-10">
        {children}
      </main>

      <footer className="border-t border-white/6 bg-black/10 py-10 text-sm text-gray-400">
        <div className="container mx-auto grid gap-4 px-4 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="font-display text-balance text-lg font-semibold text-white md:text-xl">
              TRAE Demo Wall
            </p>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              {tFooter('tagline')}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-slate-500">{tFooter('rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
