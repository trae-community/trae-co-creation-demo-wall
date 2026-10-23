'use client';

import { useTranslations } from 'next-intl';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlindBoxDialog, BlindBoxDialogClose, BlindBoxDialogContent } from './blind-box-dialog';
import { BlindBoxActionButton } from './blind-box-action-button';
import {
  blindBoxFooterHintClass,
  blindBoxShellClass,
  blindBoxSubtitleClass,
  blindBoxTitleClass,
} from '@/lib/code-blind-box/typography';
import { cn } from '@/lib/utils';

type CodeBlindBoxLoginPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: () => void;
};

export function CodeBlindBoxLoginPrompt({
  open,
  onOpenChange,
  onSignIn,
}: CodeBlindBoxLoginPromptProps) {
  const t = useTranslations('CodeBlindBox');

  return (
    <BlindBoxDialog open={open} onOpenChange={onOpenChange}>
      <BlindBoxDialogContent>
        <div
          className={cn(
            'code-blind-box relative mx-auto w-full max-w-[min(100vw-2rem,560px)] bg-transparent',
            blindBoxShellClass
          )}
        >
          <BlindBoxDialogClose />

          <div className="flex flex-col items-center gap-8 px-4 py-6 sm:px-6">
            <DialogHeader className="w-full items-center space-y-2 text-center sm:text-center">
              <DialogTitle className={cn(blindBoxTitleClass, 'whitespace-nowrap text-[#f6f8f5]')}>
                {t('loginPromptTitle')}
              </DialogTitle>
              <DialogDescription
                className={cn(blindBoxSubtitleClass, 'whitespace-nowrap text-[#a9b3ae]')}
              >
                {t('loginPromptSubtitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap justify-center gap-3">
              <BlindBoxActionButton variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                {t('loginPromptLater')}
              </BlindBoxActionButton>
              <BlindBoxActionButton size="md" onClick={onSignIn}>
                {t('loginPromptCta')}
              </BlindBoxActionButton>
            </div>

            <p className={cn(blindBoxFooterHintClass, 'whitespace-nowrap text-[#a9b3ae]')}>
              {t('loginPromptHint')}
            </p>
          </div>
        </div>
      </BlindBoxDialogContent>
    </BlindBoxDialog>
  );
}
