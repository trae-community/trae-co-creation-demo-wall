'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

/** 整屏半透明遮罩 + 模糊；内容区无实心底板，与 Figma「完整交互」一致 */
const BlindBoxDialog = DialogPrimitive.Root;
const BlindBoxDialogPortal = DialogPrimitive.Portal;

const BlindBoxDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[100] bg-[rgba(0,0,0,0.58)] backdrop-blur-[20px] supports-[backdrop-filter]:bg-[rgba(0,0,0,0.5)]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
BlindBoxDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const BlindBoxDialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> & { muted?: boolean }
>(({ className, muted, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-0 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-2xl leading-8 text-[#a9b3ae] transition-opacity hover:bg-[rgba(26,30,28,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32f08c] sm:top-4',
      muted && 'pointer-events-none opacity-30',
      className
    )}
    {...props}
  >
    ×
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
BlindBoxDialogClose.displayName = DialogPrimitive.Close.displayName;

const BlindBoxDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <BlindBoxDialogPortal>
    <BlindBoxDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-0 z-[101] flex items-center justify-center overflow-y-auto border-0 bg-transparent p-4 shadow-none outline-none sm:p-6',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </BlindBoxDialogPortal>
));
BlindBoxDialogContent.displayName = DialogPrimitive.Content.displayName;

export { BlindBoxDialog, BlindBoxDialogContent, BlindBoxDialogClose };
