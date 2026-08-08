'use client'

import { useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface CrudPaginationProps {
  totalItems: number
  startIndex: number
  endIndex: number
  current: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizes?: number[]
}

export function CrudPagination({
  totalItems,
  startIndex,
  endIndex,
  current,
  totalPages,
  onPrev,
  onNext,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizes = [5, 10, 20, 50],
}: CrudPaginationProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const jumpPage = () => {
    const num = parseInt(inputRef.current?.value || '1', 10)
    if (num >= 1 && num <= totalPages) {
      onPageChange?.(num)
    }
  }

  const handlePageSizeChange = useCallback((size: number) => {
    onPageSizeChange?.(size)
  }, [onPageSizeChange])

  // Generate page buttons: first pages ..., current pages ..., last pages
  const getPageButtons = useCallback((): Array<{ page: number; label: string }> => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => ({
        page: i + 1,
        label: String(i + 1),
      }))
    }

    const buttons: Array<{ page: number; label: string }> = []

    buttons.push({ page: 1, label: '1' })

    if (current > 3) {
      buttons.push({ page: -1, label: '...' })
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(totalPages - 1, current + 1)

    for (let i = start; i <= end; i++) {
      buttons.push({ page: i, label: String(i) })
    }

    if (current < totalPages - 2) {
      buttons.push({ page: -2, label: '...' })
    }

    buttons.push({ page: totalPages, label: String(totalPages) })

    return buttons
  }, [totalPages, current])

  const pageButtons = getPageButtons()

  return (
    <div className="p-4 border border-input rounded-lg bg-card flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-3">
      {/* Info */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="whitespace-nowrap">
          显示 {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} 共 {totalItems} 条记录
        </span>
        
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-8 px-2 rounded-md border border-input bg-background text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>条</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* First page */}
        {onPageChange && totalPages > 1 && current > 1 && (
          <button
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => onPageChange(1)}
            disabled={current <= 1}
            aria-label="第一页"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Previous button */}
        <button
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
          onClick={onPrev}
          disabled={current <= 1}
          aria-label="上一页"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page buttons */}
        {onPageChange && (
          <div className="flex items-center gap-1">
            {pageButtons.map(({ page, label }) => (
              page < 0 ? (
                <span key={`ellipsis-${page}`} className="px-1 text-muted-foreground">
                  {label}
                </span>
              ) : (
                <button
                  key={page}
                  className={`h-8 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    page === current
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => onPageChange(page)}
                  disabled={page === current}
                >
                  {label}
                </button>
              )
            ))}
          </div>
        )}

        {/* Next button */}
        <button
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
          onClick={onNext}
          disabled={current >= totalPages}
          aria-label="下一页"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last page */}
        {onPageChange && totalPages > 1 && current < totalPages && (
          <button
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => onPageChange(totalPages)}
            disabled={current >= totalPages}
            aria-label="最后一页"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Go to page */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1 ml-2">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              ref={inputRef}
              defaultValue=""
              onKeyDown={(e) => e.key === 'Enter' && jumpPage()}
              className="h-8 w-16 rounded-md border border-input bg-input px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span>页</span>
            <button
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow"
              onClick={jumpPage}
            >
              跳转
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
