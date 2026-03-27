import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/language/routing';
import { auth } from '@/lib/auth-nextauth';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = (pathname: string) => {
  return /^\/(zh-CN|en-US)\/(submit|console|profile)/.test(pathname);
};

const isApiRoute = (pathname: string) => pathname.startsWith('/api');
const isAuthRoute = (pathname: string) => pathname.startsWith('/api/auth');

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Auth routes are always public
  if (isAuthRoute(pathname)) return NextResponse.next();

  const isPrefetchRequest =
    req.headers.get('purpose') === 'prefetch' ||
    req.headers.has('next-router-prefetch');

  // Protected routes require authentication
  if (isProtectedRoute(pathname) && !isPrefetchRequest) {
    if (!req.auth) {
      const signInUrl = new URL(`/${pathname.split('/')[1]}/sign-in`, req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // API routes skip i18n middleware
  if (isApiRoute(pathname)) return NextResponse.next();

  return handleI18nRouting(req as NextRequest);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
