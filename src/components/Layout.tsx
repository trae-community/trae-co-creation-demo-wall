'use client'

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { PlusCircle, Home, LogIn, Languages } from "lucide-react";
import { ParticlesBackground } from "./ParticlesBackground";
import { useLanguageStore } from "../store/useLanguageStore";
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground relative z-0">
      <ParticlesBackground />
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white tracking-tight group">
            <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.5)] group-hover:shadow-[0_0_25px_rgba(34,197,94,0.8)] transition-all duration-300">
              <path fillRule="evenodd" clipRule="evenodd" d="M0 0H100V70H0V0ZM20 18H80V52H20V18Z" fill="#22C55E"/>
              <path d="M38 27L46 35L38 43L30 35Z" fill="#22C55E"/>
              <path d="M62 27L70 35L62 43L54 35Z" fill="#22C55E"/>
            </svg>
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
              {language === 'zh' ? '首页' : 'Home'}
            </Link>
            <Link
              href="/submit"
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                pathname === "/submit"
                  ? "bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {language === 'zh' ? '提交' : 'Submit'}
            </Link>
            
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
                {language === 'zh' ? '登录 / 注册' : 'Login / Register'}
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2 px-4 py-1.5">
                <UserButton />
              </div>
            </SignedIn>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Languages className="w-3.5 h-3.5" />
              {language === 'zh' ? 'EN' : '中'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-card border-t border-border py-8 text-center text-gray-400 text-sm">
        <div className="container mx-auto px-4">
          <p>© 2026 TRAE DEMO WALL. All rights reserved.</p>
          <p className="mt-2">{language === 'zh' ? '展示每一个真实完成的作品' : 'Showcasing every real completed work'}</p>
        </div>
      </footer>
    </div>
  );
}
