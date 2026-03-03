'use client'

interface CrudPaginationProps {
  totalItems: number
  startIndex: number
  endIndex: number
  current: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function CrudPagination({
  totalItems,
  startIndex,
  endIndex,
  current,
  totalPages,
  onPrev,
  onNext,
}: CrudPaginationProps) {
  return (
    <div className="p-4 border border-border rounded-xl bg-card flex items-center justify-between text-sm text-muted-foreground">
      <div>显示 {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} 共 {totalItems} 条记录</div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50"
          disabled={current <= 1}
          onClick={onPrev}
        >
          上一页
        </button>
        <button
          className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50"
          disabled={current >= totalPages}
          onClick={onNext}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
