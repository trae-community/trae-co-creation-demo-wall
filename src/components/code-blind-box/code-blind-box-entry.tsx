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
  isCodeBlindBoxDevTools,
  isCodeBlindBoxEnabled,
  resetBlindBoxSession,
} from '@/lib/code-blind-box';
import type { BlindBoxSession } from '@/lib/code-blind-box/types';
import { TraeBaoMascot } from './trae-bao-mascot';
import { CodeBlindBoxLoginPrompt } from './code-blind-box-login-prompt';
import { CodeBlindBoxModal } from './code-blind-box-modal';

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
  const showReset = isCodeBlindBoxDevTools();
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
  const [isResetting, setIsResetting] = useState(false);
  const openedFromQueryRef = useRef(false);

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

  const loadSession = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await fetchBlindBoxSession();
      if (!data) return;
      setSession(data);
    } catch {
      /* ignore */
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
    if (searchParams.get('blindBox') !== '1' || status === 'loading' || openedFromQueryRef.current) {
      return;
    }
    openedFromQueryRef.current = true;
    if (status === 'authenticated') {
      setModalOpen(true);
    } else {
      setLoginPromptOpen(true);
    }
  }, [searchParams, status]);

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
    setModalOpen(true);
  };

  const handleReset = async () => {
    if (status !== 'authenticated') return;
    setIsResetting(true);
    try {
      const data = await resetBlindBoxSession();
      if (data) {
        setSession(data);
        setModalOpen(false);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const showFabBubble =
    fabState === 'guest' ||
    fabState === 'invite' ||
    fabState === 'progress' ||
    fabState === 'selected';

  return (
    <>
      <div
        className="fixed bottom-20 right-0 z-[90] flex flex-col items-end gap-2 pr-6 sm:bottom-24 sm:pr-10 md:pr-14"
      >
        <button
          type="button"
          onClick={handleFabClick}
          className="group flex w-[228px] max-w-[calc(100vw-3rem)] flex-col items-stretch overflow-visible text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32f08c] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-xl"
          aria-label={t('fabAria')}
        >
          {showFabBubble && (
            <div
              className="relative z-10 -translate-y-1 self-start pl-6"
              aria-hidden
            >
              <div
                className="relative box-border h-[64px] min-w-[188px] w-max max-w-[min(280px,calc(100vw-3rem))] overflow-visible rounded-xl bg-[#f8f9f5] font-[family-name:var(--font-chinese,var(--font-sans))] shadow-[0_8px_20px_-2px_rgba(0,0,0,0.14)]"
              >
                <p
                  className="absolute left-3 top-3 max-w-[calc(100%-24px)] whitespace-nowrap text-[14px] font-bold leading-5 text-[#1f221b]"
                >
                  {fabState === 'guest'
                    ? t('fabGuestBubbleTitle')
                    : fabState === 'selected'
                      ? t('fabSelectedTitle')
                      : t('fabBubbleTitle')}
                </p>
                <p
                  className="absolute left-3 top-9 max-w-[calc(100%-24px)] whitespace-nowrap text-xs font-normal leading-5 text-[#69736c]"
                >
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
                  className="pointer-events-none absolute right-[6px] top-[61px] h-4 w-6"
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              'flex w-full justify-start pl-[62px] transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]',
              showFabBubble && '-mt-2'
            )}
          >
            <TraeBaoMascot variant={fabState === 'selected' && isAuthenticated ? 'selected' : 'invite'} />
          </div>
        </button>

        {showReset && status === 'authenticated' && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="text-[10px] px-2 py-1 rounded-md border border-dashed border-zinc-500/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-300 transition-colors"
            title={t('resetHint')}
          >
            {isResetting ? t('resetting') : t('reset')}
          </button>
        )}
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
