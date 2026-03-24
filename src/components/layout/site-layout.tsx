'use client'

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PlusCircle, Home, LogIn, Languages, Check, LayoutDashboard, UserRound } from "lucide-react";
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
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white tracking-tight group">
            <Image src={logo} alt="logo" className="w-8 h-8" />
            <span className="truncate bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">TRAE DEMO WALL</span>
          </Link>

          <nav className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-md">
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
              href="/submit"
              prefetch={false}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/submit"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
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

            <SignedIn>
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  pathname === "/profile"
                    ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
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
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  pathname === "/sign-in"
                    ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('login')}
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2 px-4 py-1.5">
                <UserButton />
              </div>
            </SignedIn>

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
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-card border-t border-border py-8 text-center text-gray-400 text-sm">
        <div className="container mx-auto px-4">
          <p>{tFooter('rights')}</p>
          <p className="mt-2">{tFooter('slogan')}</p>
        </div>
      </footer>
    </div>
  );
}
