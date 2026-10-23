'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlindBoxDialog, BlindBoxDialogClose, BlindBoxDialogContent } from './blind-box-dialog';
import { cn } from '@/lib/utils';
import { confirmBlindBoxChoice, drawBlindBoxSet } from '@/lib/code-blind-box/api-client';
import type { BlindBoxDraw, BlindBoxSession } from '@/lib/code-blind-box/types';
import type { BlindBoxDimension } from '@/lib/code-blind-box/words';
import { BlindBoxCard } from './blind-box-card';
import { BlindBoxActionButton } from './blind-box-action-button';
import { BlindBoxRoundCard } from './blind-box-round-card';
import {
  blindBoxFooterHintClass,
  blindBoxShellClass,
  blindBoxSubtitleClass,
  blindBoxTitleClass,
  blindBoxTitleLatinClass,
} from '@/lib/code-blind-box/typography';

type Phase = 'flipping' | 'after-first' | 'after-second' | 'choosing' | 'readonly';

type CodeBlindBoxModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: BlindBoxSession;
  onSessionChange: (session: BlindBoxSession) => void;
};

const CARD_ORDER: BlindBoxDimension[] = ['theme', 'function', 'style'];
const LOCK_MIN_DURATION_MS = 2000;
const LOCK_FINISH_MS = 520;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const pad2 = (n: number) => String(n).padStart(2, '0');

type InlineErrorKind = 'draw' | 'confirm' | null;

function phaseFromSession(session: BlindBoxSession): Phase {
  if (session.confirmed) return 'readonly';
  if (session.options.length >= 2) return 'after-second';
  if (session.options.length === 1) return 'after-first';
  return 'flipping';
}

export function CodeBlindBoxModal({
  open,
  onOpenChange,
  session,
  onSessionChange,
}: CodeBlindBoxModalProps) {
  const t = useTranslations('CodeBlindBox');

  const [phase, setPhase] = useState<Phase>('flipping');
  const [activeDraw, setActiveDraw] = useState<BlindBoxDraw | null>(null);
  const [flipped, setFlipped] = useState<Set<BlindBoxDimension>>(new Set());
  const [phaseLocked, setPhaseLocked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [inlineError, setInlineError] = useState<InlineErrorKind>(null);
  const [pendingConfirmSlot, setPendingConfirmSlot] = useState<1 | 2 | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [pickSlot, setPickSlot] = useState<1 | 2 | null>(null);
  const [chosenDraw, setChosenDraw] = useState<BlindBoxDraw | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [lockProgress, setLockProgress] = useState(0);
  const [lockProgressSmooth, setLockProgressSmooth] = useState(false);
  const [lockViewPhase, setLockViewPhase] = useState<Phase | null>(null);

  const applyOpenState = useCallback((next: BlindBoxSession) => {
    const nextPhase = phaseFromSession(next);
    setPhase(nextPhase);
    setInlineError(null);
    setPendingConfirmSlot(null);
    setShowBurst(false);
    setCopyOk(false);
    setChosenDraw(null);
    setPickSlot(next.chosenSlot);
    if (nextPhase === 'readonly') {
      const chosen = next.options.find((item) => item.slot === next.chosenSlot) ?? null;
      setActiveDraw(chosen);
      setChosenDraw(chosen);
      setFlipped(new Set(['theme', 'function', 'style']));
      setPhaseLocked(true);
      return;
    }
    if (nextPhase === 'after-second') {
      setActiveDraw(next.options[1] ?? next.options[0] ?? null);
      setFlipped(new Set(['theme', 'function', 'style']));
      setPhaseLocked(true);
      return;
    }
    if (nextPhase === 'after-first') {
      setActiveDraw(next.options[0] ?? null);
      setFlipped(new Set(['theme', 'function', 'style']));
      setPhaseLocked(true);
      return;
    }
    setActiveDraw(null);
    setFlipped(new Set());
    setPhaseLocked(false);
  }, []);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;
    applyOpenState(session);
  }, [open, session, applyOpenState]);

  const allFlipped = flipped.size === 3;
  const displayPhase =
    phase === 'flipping' && allFlipped && activeDraw
      ? activeDraw.slot === 2
        ? 'after-second'
        : 'after-first'
      : phase;
  const uiPhase = isConfirming && lockViewPhase ? lockViewPhase : displayPhase;
  const isReadonly = uiPhase === 'readonly';
  const isFlippingCards = uiPhase === 'flipping' && !allFlipped;
  const displayDraw = chosenDraw ?? activeDraw;
  const currentGroup = activeDraw?.slot ?? Math.max(session.options.length, 1);
  const remainingDraws = Math.max(0, 2 - session.options.length);

  useEffect(() => {
    if (phase === 'flipping' && allFlipped && activeDraw) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [phase, allFlipped, activeDraw]);

  useEffect(() => {
    if (phase !== 'flipping' || !allFlipped || !activeDraw) return;
    const next = activeDraw.slot === 2 ? 'after-second' : 'after-first';
    setPhase(next);
  }, [phase, allFlipped, activeDraw]);

  useEffect(() => {
    if (!isConfirming) return;
    const duration = LOCK_MIN_DURATION_MS;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 2;
      const percent = eased * 92;
      setLockProgress(percent);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isConfirming]);

  const wordFor = (dimension: BlindBoxDimension) => {
    if (!activeDraw) return undefined;
    if (dimension === 'theme') return activeDraw.themeWord;
    if (dimension === 'function') return activeDraw.functionWord;
    return activeDraw.styleWord;
  };

  const commitDraw = async (): Promise<BlindBoxDraw | null> => {
    setIsDrawing(true);
    setInlineError(null);
    setPendingConfirmSlot(null);
    try {
      const next = await drawBlindBoxSet();
      if (!next) {
        setInlineError('draw');
        return null;
      }
      onSessionChange(next);
      const latest = next.options[next.options.length - 1] ?? null;
      setActiveDraw(latest);
      setPhaseLocked(true);
      return latest;
    } catch {
      setInlineError('draw');
      return null;
    } finally {
      setIsDrawing(false);
    }
  };

  const handleFlip = async (dimension: BlindBoxDimension) => {
    if (phase !== 'flipping' || flipped.has(dimension)) return;
    if (!activeDraw && !phaseLocked) {
      const result = await commitDraw();
      if (!result) return;
    }
    setFlipped((prev) => new Set(prev).add(dimension));
  };

  const startSecondDraw = () => {
    setPhase('flipping');
    setActiveDraw(null);
    setFlipped(new Set());
    setPhaseLocked(false);
    setShowBurst(false);
    setInlineError(null);
    setPendingConfirmSlot(null);
  };

  const confirmSlot = async (slot: 1 | 2) => {
    setPendingConfirmSlot(slot);
    setLockViewPhase(phase);
    setIsConfirming(true);
    setInlineError(null);
    setLockProgress(0);
    setLockProgressSmooth(false);
    try {
      const apiPromise = confirmBlindBoxChoice(slot);
      const minDelay = sleep(LOCK_MIN_DURATION_MS);
      const [result] = await Promise.all([apiPromise, minDelay]);

      if (!result.ok) {
        setInlineError('confirm');
        setLockViewPhase(null);
        setIsConfirming(false);
        setLockProgress(0);
        return;
      }

      setLockProgressSmooth(true);
      setLockProgress(100);
      await sleep(LOCK_FINISH_MS);

      const next = result.session;
      const picked = next.options.find((item) => item.slot === slot) ?? null;
      onSessionChange(next);
      setChosenDraw(picked);
      setActiveDraw(picked);
      setFlipped(new Set(['theme', 'function', 'style']));
      setPhase('readonly');
      setLockViewPhase(null);
      setPendingConfirmSlot(null);
      setCopyOk(false);

      setIsConfirming(false);
      setLockProgressSmooth(false);
      setLockProgress(0);
    } catch {
      setInlineError('confirm');
      setLockViewPhase(null);
      setIsConfirming(false);
      setLockProgressSmooth(false);
      setLockProgress(0);
    }
  };

  const handleCopyPrompt = async () => {
    if (!displayDraw) return;
    const text = t('promptPlain', {
      styleWord: displayDraw.styleWord,
      themeWord: displayDraw.themeWord,
      functionWord: displayDraw.functionWord,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      /* copy failure — keep UI on copy button */
    }
  };

  const retryDraw = async () => {
    setInlineError(null);
    await commitDraw();
  };

  const retryConfirm = () => {
    const slot =
      pendingConfirmSlot ??
      pickSlot ??
      (uiPhase === 'after-first' ? 1 : activeDraw?.slot ?? null);
    if (slot === 1 || slot === 2) confirmSlot(slot);
  };

  const blockDismiss =
    phase === 'flipping' && phaseLocked && flipped.size > 0 && !allFlipped;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (blockDismiss || isDrawing || isConfirming) return;
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
  };

  const showKeycapCards =
    uiPhase === 'flipping' ||
    uiPhase === 'after-first' ||
    uiPhase === 'after-second' ||
    isReadonly;

  const blockClose = blockDismiss || isDrawing || isConfirming;

  const isChoosingView = uiPhase === 'choosing';
  const showBrandTitle = !isReadonly && !isChoosingView;
  const headerTitle = isReadonly
    ? t('lockedTitle')
    : isChoosingView
      ? t('chooseTitle')
      : t('title');
  const showGenErrorSubtitle = inlineError === 'draw' && isFlippingCards;
  const subtitleAccent = isFlippingCards && !showGenErrorSubtitle;

  const headerSubtitle = isConfirming
    ? t('lockingSubtitle', { n: pendingConfirmSlot ?? pickSlot ?? currentGroup })
    : isReadonly
      ? t('lockedSubtitle', { slot: session.chosenSlot ?? 1 })
      : showGenErrorSubtitle
        ? t('genErrorSubtitle')
        : isChoosingView
          ? t('chooseSubtitle')
          : isFlippingCards
            ? t('flipHint')
            : t('statusSubtitle', {
                current: currentGroup,
                remaining: remainingDraws,
              });

  const footerHint = isReadonly
    ? copyOk
      ? t('copySuccessHint')
      : t('successHint')
    : isConfirming
      ? t('lockingProgressHint')
      : isDrawing
        ? t('generatingProgressHint')
        : inlineError === 'confirm'
          ? t('confirmErrorInline')
          : inlineError === 'draw'
            ? t('drawErrorInline')
            : isChoosingView
              ? t('compareFooterHint')
              : isFlippingCards
                ? t('flipGuide')
                : uiPhase === 'after-first' || uiPhase === 'after-second'
                  ? t('lockRule')
                  : null;

  const showSecondDrawFallback =
    inlineError === 'draw' && session.options.length >= 1 && uiPhase === 'flipping';
  const activeSetNumber = activeDraw?.slot ?? (session.options.length >= 2 ? 2 : 1);

  return (
    <BlindBoxDialog open={open} onOpenChange={handleOpenChange}>
      <BlindBoxDialogContent
        onPointerDownOutside={(e) => {
          if (blockClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (blockClose) e.preventDefault();
        }}
      >
        <div
          className={cn(
            'code-blind-box relative mx-auto flex w-full max-w-[1040px] flex-col items-center overflow-visible bg-transparent',
            blindBoxShellClass
          )}
        >
          {!blockClose && <BlindBoxDialogClose />}

          {showBurst && (
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(50,240,140,0.28),transparent_60%)] animate-blind-box-flash" />
            </div>
          )}

          <div className="flex w-full flex-col items-center gap-8 px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex w-full flex-col items-center gap-8">
          <DialogHeader className="w-full items-center space-y-2 text-center sm:text-center">
            <DialogTitle className={cn(blindBoxTitleClass, 'text-[#f6f8f5]')}>
              {showBrandTitle ? (
                <>
                  <span className={blindBoxTitleLatinClass}>{t('titleBrand')}</span>
                  <span>{` ${t('titleSuffix')}`}</span>
                </>
              ) : (
                headerTitle
              )}
            </DialogTitle>
            <DialogDescription
              className={cn(
                blindBoxSubtitleClass,
                subtitleAccent ? 'text-[#32f08c]' : 'text-[#a9b3ae]'
              )}
            >
              {headerSubtitle}
            </DialogDescription>
          </DialogHeader>

          {isChoosingView ? (
            <div className="mx-auto grid w-full max-w-[808px] grid-cols-1 justify-items-center gap-5 sm:grid-cols-2">
              {session.options.map((option) => (
                <BlindBoxRoundCard
                  key={option.slot}
                  draw={option}
                  roundLabel={t('roundLabel', { n: String(option.slot).padStart(2, '0') })}
                  pickHint={t('pickRoundHint')}
                  selectedHint={t('selectedRoundHint')}
                  selected={pickSlot === option.slot}
                  onSelect={() => {
                    if (isConfirming) return;
                    setPickSlot(option.slot);
                    setInlineError(null);
                  }}
                />
              ))}
            </div>
          ) : showKeycapCards ? (
            <div className="mx-auto grid w-fit max-w-full grid-cols-3 gap-5">
              {CARD_ORDER.map((dimension) => (
                <BlindBoxCard
                  key={dimension}
                  dimension={dimension}
                  word={wordFor(dimension)}
                  flipped={flipped.has(dimension)}
                  disabled={isDrawing || uiPhase !== 'flipping' || isConfirming}
                  shaking={uiPhase === 'flipping' && !flipped.has(dimension) && !isDrawing}
                  onFlip={() => handleFlip(dimension)}
                />
              ))}
            </div>
          ) : null}

          </div>

          <div className="flex min-h-[104px] w-full flex-col items-center justify-center">
            {isConfirming ? (
              <>
                <BlindBoxActionButton size="lg" className="pointer-events-none cursor-wait">
                  {t('locking')}
                </BlindBoxActionButton>
                <div
                  className="mt-4 h-1 w-[320px] overflow-hidden rounded-[2px] bg-[#343b37] ring-1 ring-[#343b37]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(lockProgress)}
                >
                  <div
                    className="h-full rounded-[2px] bg-[#32f08c] shadow-[0_0_12px_rgba(50,240,140,0.55)]"
                    style={{
                      width: `${lockProgress}%`,
                      transition: lockProgressSmooth ? 'width 0.52s ease-out' : 'none',
                    }}
                  />
                </div>
              </>
            ) : inlineError === 'confirm' ? (
              <BlindBoxActionButton size="lg" onClick={retryConfirm}>
                {t('retryConfirm')}
              </BlindBoxActionButton>
            ) : inlineError === 'draw' && showSecondDrawFallback ? (
              <div className="flex flex-wrap justify-center gap-3">
                <BlindBoxActionButton variant="secondary" size="sm" onClick={() => confirmSlot(1)}>
                  {t('useSetFirst')}
                </BlindBoxActionButton>
                <BlindBoxActionButton size="sm" onClick={retryDraw}>
                  {t('retryDraw')}
                </BlindBoxActionButton>
              </div>
            ) : inlineError === 'draw' ? (
              <BlindBoxActionButton size="lg" onClick={retryDraw}>
                {t('retryDraw')}
              </BlindBoxActionButton>
            ) : isReadonly ? (
              <div className="flex flex-wrap justify-center gap-3">
                <BlindBoxActionButton variant="secondary" size="sm" onClick={handleCopyPrompt}>
                  {copyOk ? t('promptCopied') : t('copyPrompt')}
                </BlindBoxActionButton>
                <BlindBoxActionButton size="sm" onClick={() => onOpenChange(false)}>
                  {t('done')}
                </BlindBoxActionButton>
              </div>
            ) : isFlippingCards ? (
              <BlindBoxActionButton
                variant="disabled"
                size="lg"
                className={isDrawing ? 'cursor-wait' : undefined}
              >
                {isDrawing ? t('generating') : t('flipAllFirst')}
              </BlindBoxActionButton>
            ) : uiPhase === 'after-first' ? (
              <div className="flex flex-wrap justify-center gap-3">
                <BlindBoxActionButton variant="secondary" size="sm" onClick={startSecondDraw}>
                  {t('drawAgain')}
                </BlindBoxActionButton>
                <BlindBoxActionButton size="md" onClick={() => confirmSlot(1)}>
                  {t('confirmThisSet')}
                </BlindBoxActionButton>
              </div>
            ) : uiPhase === 'after-second' ? (
              <div className="flex flex-wrap justify-center gap-3">
                <BlindBoxActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPhase('choosing');
                    setPickSlot(null);
                  }}
                >
                  {t('compareBoth')}
                </BlindBoxActionButton>
                <BlindBoxActionButton size="md" onClick={() => confirmSlot(activeDraw?.slot ?? 2)}>
                  {t('useSet', { n: activeSetNumber })}
                </BlindBoxActionButton>
              </div>
            ) : isChoosingView ? (
              <BlindBoxActionButton
                size="lg"
                variant={pickSlot ? 'primary' : 'disabled'}
                disabled={!pickSlot}
                onClick={() => pickSlot && confirmSlot(pickSlot)}
              >
                {pickSlot ? t('confirmRound', { n: pad2(pickSlot) }) : t('confirmChoice')}
              </BlindBoxActionButton>
            ) : null}

            {footerHint && (
              <p
                className={cn(
                  blindBoxFooterHintClass,
                  'max-w-[960px] transition-opacity duration-300',
                  isConfirming ? 'mt-3' : 'mt-4',
                  inlineError
                    ? 'text-[#ff8a8a]'
                    : isReadonly && copyOk
                      ? 'text-[#32f08c]'
                      : 'text-[#a9b3ae]'
                )}
              >
                {footerHint}
              </p>
            )}
          </div>
          </div>
        </div>
      </BlindBoxDialogContent>
    </BlindBoxDialog>
  );
}
