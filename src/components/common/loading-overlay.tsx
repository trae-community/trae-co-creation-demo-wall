'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
}

export function LoadingOverlay({ isLoading, text }: LoadingOverlayProps) {
  const t = useTranslations('Console')
  const label = text ?? t('loading')
  if (!isLoading) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
