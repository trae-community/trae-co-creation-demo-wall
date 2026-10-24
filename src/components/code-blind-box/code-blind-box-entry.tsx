'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/language/navigation';
import { cn } from '@/lib/utils';
import {
  blindBoxAssets,
  emptyBlindBoxSession,
  fetchBlindBoxSession,
  isCodeBlindBoxEnabled,
} from '@/lib/code-blind-box';
import type { BlindBoxSession } from '@/lib/code-blind-box/types';
import { TraeBaoMascot } from './trae-bao-mascot';
import { CodeBlindBoxLoginPrompt } from './code-blind-box-login-prompt';
import { CodeBlindBoxModal } from './code-blind-box-modal';
import { useBlindBoxFabDrag } from './use-blind-box-fab-drag';

type FabWidgetState = 'guest' | 'invite' | 'progress' | 'selected';

function usePageReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const mark = () => {
      requestAnimationFrame(() => setReady(true));
    };
    if (document.readyState === 'complete') mark();
    else window.addEventListener('load', mark, { once: true });
  }, []);
  return ready;
}

export function CodeBlindBoxEntry() {
  const enabled = isCodeBlindBoxEnabled();
  const pageReady = usePageReady();
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const t = useTranslations('CodeBlindBox');

  const [modalOpen, setModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [session, setSession] = useState<BlindBoxSession>(() => emptyBlindBoxSession());
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const openedFromQueryRef = useRef(false);
  const fabDrag = useBlindBoxFabDrag();

  const isConsole = pathname?.includes('/console');
  const hasConfirmed = session.confirmed;
  const progressSetCount = session.options.length;

  const isAuthenticated = status === 'authenticated';

  const fabState: FabWidgetState = !isAuthenticated
    ? 'guest'
    : hasConfirmed
      ? 'selected'
      : progressSetCount > 0
        ? 'progress'
        : 'invite';

  const loadSession = useCallback(async (): Promise<BlindBoxSession> => {
    if (status !== 'authenticated') {
      const empty = emptyBlindBoxSession();
      setSession(empty);
      return empty;
    }
    try {
      const data = await fetchBlindBoxSession();
      const next = data ?? emptyBlindBoxSession();
      setSession(next);
      return next;
    } catch {
      const empty = emptyBlindBoxSession();
      setSession(empty);
      return empty;
    }
  }, [status]);

  useEffect(() => {
    if (!pageReady) return;
    if (status === 'loading') return;

    if (status !== 'authenticated') {
      setSessionLoaded(true);
      return;
    }

    setSessionLoaded(false);
    loadSession().finally(() => setSessionLoaded(true));
  }, [pageReady, status, loadSession]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadSession();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [status, loadSession]);

  useEffect(() => {
    if (searchParams.get('blindBox') !== '1' || status === 'loading' || openedFromQueryRef.current) {
      return;
    }
    openedFromQueryRef.current = true;
    if (status === 'authenticated') {
      void loadSession().then(() => setModalOpen(true));
    } else {
      setLoginPromptOpen(true);
    }
  }, [searchParams, status, loadSession]);

  if (!enabled || isConsole || !pageReady || !sessionLoaded) return null;

  const blindBoxReturnPath = `/${locale}?blindBox=1`;

  const goToSignIn = () => {
    setLoginPromptOpen(false);
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(blindBoxReturnPath)}`);
  };

  const handleFabClick = () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    void loadSession().then(() => setModalOpen(true));
  };

  const showFabBubble =
    fabState === 'guest' ||
    fabState === 'invite' ||
    fabState === 'progress' ||
    fabState === 'selected';

  return (
    <>
      <div
        className="fixed right-0 z-[90] flex flex-col items-end gap-2 pr-6 sm:pr-10 md:pr-14 touch-none select-none"
        style={{ bottom: fabDrag.bottomPx }}
        title={t('fabDragHint')}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={t('fabAria')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFabClick();
            }
          }}
          onPointerDown={fabDrag.onPointerDown}
          onPointerMove={fabDrag.onPointerMove}
          onPointerUp={(e) => {
            const dragged = fabDrag.onPointerUp(e);
            if (!dragged) handleFabClick();
          }}
          onPointerCancel={fabDrag.onPointerCancel}
          className="group flex w-max min-w-[188px] max-w-[min(320px,calc(100vw-3rem))] cursor-grab flex-col items-stretch overflow-visible text-left active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32f08c] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-xl"
        >
          {showFabBubble && (
            <div
              className="relative z-10 -translate-y-1 self-start pl-6"
              aria-hidden
            >
              <div
                className="relative box-border min-w-[188px] max-w-[min(300px,calc(100vw-3rem))] rounded-xl bg-[#f8f9f5] px-3 pt-2.5 pb-3.5 font-[family-name:var(--font-chinese,var(--font-sans))] shadow-[0_8px_20px_-2px_rgba(0,0,0,0.14)]"
              >
                <p className="text-[14px] font-bold leading-snug text-[#1f221b] [overflow-wrap:anywhere]">
                  {fabState === 'guest'
                    ? t('fabGuestBubbleTitle')
                    : fabState === 'selected'
                      ? t('fabSelectedTitle')
                      : t('fabBubbleTitle')}
                </p>
                <p className="mt-1 text-xs font-normal leading-snug text-[#69736c] [overflow-wrap:anywhere]">
                  {fabState === 'guest'
                    ? t('fabGuestBubbleSubtitle')
                    : fabState === 'selected'
                      ? t('fabSelectedSubtitle')
                      : fabState === 'progress'
                        ? t('fabBubbleProgressSubtitle', { count: progressSetCount })
                        : t('fabBubbleSubtitle')}
                </p>
                <Image
                  src={blindBoxAssets.bubbleTail}
                  alt=""
                  width={24}
                  height={16}
                  className="pointer-events-none absolute right-[6px] top-[calc(100%-3px)] h-4 w-6 shrink-0"
                  unoptimized
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              'blind-box-fab-scale flex w-full justify-start pl-[62px] transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]',
              showFabBubble && '-mt-2'
            )}
          >
            <TraeBaoMascot variant={fabState === 'selected' && isAuthenticated ? 'selected' : 'invite'} />
          </div>
        </div>
      </div>

      <CodeBlindBoxLoginPrompt
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
        onSignIn={goToSignIn}
      />

      {isAuthenticated && (
        <CodeBlindBoxModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          session={session}
          onSessionChange={setSession}
        />
      )}
    </>
  );
}
