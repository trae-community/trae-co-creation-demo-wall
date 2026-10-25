'use client'

import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Link } from '@/lib/language/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ListEmptyAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline'
}

type ListEmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ListEmptyAction[]
  className?: string
}

export function ListEmptyState({
  title,
  description,
  icon,
  actions,
  className,
}: ListEmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 px-6 rounded-xl border-2 border-dashed border-border/60 bg-card/50 flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon ?? <Inbox className="w-7 h-7" />}
      </div>
      <p className="text-foreground font-medium text-sm">{title}</p>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-md">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {actions.map((action) =>
            action.href ? (
              <Button key={action.label} variant={action.variant ?? 'default'} size="sm" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button
                key={action.label}
                variant={action.variant ?? 'outline'}
                size="sm"
                type="button"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
