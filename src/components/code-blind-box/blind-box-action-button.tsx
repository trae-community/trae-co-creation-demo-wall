'use client';

import { cn } from '@/lib/utils';

type BlindBoxActionButtonProps = {
  variant?: 'primary' | 'secondary' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit';
};

const WIDTH = {
  sm: 'w-[160px]',
  md: 'w-[176px]',
  lg: 'w-[200px]',
} as const;

export function BlindBoxActionButton({
  variant = 'primary',
  size = 'sm',
  className,
  disabled,
  onClick,
  children,
  type = 'button',
}: BlindBoxActionButtonProps) {
  const isDisabledLook = variant === 'disabled' || disabled;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-12 shrink-0 items-center justify-center rounded-lg px-4 text-[15px] font-medium leading-[22px] transition-colors',
        WIDTH[size],
        isDisabledLook &&
          'cursor-not-allowed bg-[#343b37] text-[#a9b3ae] hover:bg-[#343b37]',
        !isDisabledLook &&
          variant === 'primary' &&
          'bg-[#32f08c] text-[#1f221b] hover:bg-[#45f59a]',
        !isDisabledLook &&
          variant === 'secondary' &&
          'border border-[#343b37] bg-[#1a1e1c] text-[#f6f8f5] hover:bg-[#232825]',
        className
      )}
    >
      {children}
    </button>
  );
}
