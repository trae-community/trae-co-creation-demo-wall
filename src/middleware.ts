import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/language/routing';

const handleI18nRouting = createMiddleware(routing);
const isProtectedRoute = createRouteMatcher(['/:language/submit(.*)', '/:language/console(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  // API 路由和控制台路由不做 i18n 处理
  if (isApiRoute(req)) return;

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
