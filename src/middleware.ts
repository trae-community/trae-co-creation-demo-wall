import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/language/routing';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/:language/submit(.*)', '/:language/console(.*)', '/:language/profile(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const isPrefetchRequest =
    req.headers.get('purpose') === 'prefetch' ||
    req.headers.has('next-router-prefetch');

  if (isProtectedRoute(req) && !isPrefetchRequest) {
    await auth.protect();
  }

  // API routes skip i18n middleware.
  if (isApiRoute(req)) return NextResponse.next();

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
