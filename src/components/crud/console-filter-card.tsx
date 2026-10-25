'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ConsoleFilterCardProps = {
  children: ReactNode
  className?: string
  hasActiveFilters?: boolean
  activeLabel?: string
  onReset?: () => void
  resetLabel?: string
}

/** 控制台列表页统一筛选区外框（与作品管理卡片样式一致） */
export function ConsoleFilterCard({
  children,
  className,
  hasActiveFilters,
  activeLabel = '已筛选',
  onReset,
  resetLabel = '重置筛选',
}: ConsoleFilterCardProps) {
  return (
    <div className={cn('p-4 rounded-xl border border-border bg-card space-y-3', className)}>
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {activeLabel}
          </Badge>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-primary hover:underline shrink-0"
            >
              {resetLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
