import { cn } from '@/lib/utils'

type ListRowSkeletonProps = {
  rows?: number
  className?: string
}

/** 控制台列表行骨架 */
export function ListRowSkeleton({ rows = 5, className }: ListRowSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card/50 p-4 flex gap-4 animate-pulse"
        >
          <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WorkGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
          <div className="animate-pulse bg-muted aspect-[4/3]" />
          <div className="p-5 space-y-3">
            <div className="animate-pulse h-4 bg-muted rounded-md w-3/4" />
            <div className="animate-pulse h-3 bg-muted rounded-md w-full" />
            <div className="animate-pulse h-3 bg-muted rounded-md w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
