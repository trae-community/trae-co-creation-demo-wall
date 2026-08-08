'use client'

import { useState, useCallback } from 'react'

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
  const [inputValue, setInputValue] = useState(String(current))

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpPage()
    }
  }, [])

  const handleJumpClick = useCallback(() => {
    handleJumpPage()
  }, [])

  const handleJumpPage = useCallback(() => {
    const num = parseInt(inputValue, 10)
    if (num >= 1 && num <= totalPages && num !== current) {
      onPageChange?.(num)
      setInputValue(String(num))
    } else {
      setInputValue(String(current))
    }
  }, [inputValue, totalPages, current, onPageChange])

  const handlePageSizeChange = useCallback((size: number) => {
    onPageSizeChange?.(size)
  }, [onPageSizeChange])

  // Generate page buttons: first pages ..., current pages ..., last pages
  const getPageButtons = useCallback((): Array<{ page: number; label: string }> => {
    if (totalPages <= 7) {
      // Show all pages if ≤ 7
      return Array.from({ length: totalPages }, (_, i) => ({
        page: i + 1,
        label: String(i + 1),
      }))
    }

    const buttons: Array<{ page: number; label: string }> = []

    // Always show page 1
    buttons.push({ page: 1, label: '1' })

    if (current > 3) {
      buttons.push({ page: -1, label: '...' })
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(totalPages - 1, current + 1)

    for (let i = start; i <= end; i++) {
      buttons.push({ page: i, label: String(i) })
    }

    if (current < totalPages - 2) {
      buttons.push({ page: -2, label: '...' })
    }

    // Always show last page
    buttons.push({ page: totalPages, label: String(totalPages) })

    return buttons
  }, [totalPages, current])

  const pageButtons = getPageButtons()

  return (
    <div className="p-4 border border-border rounded-xl bg-card flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-3">
      {/* Info */}
      <div className="flex items-center gap-2 flex-wrap">
        <span>显示 {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} 共 {totalItems} 条记录</span>
        
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1">
            <span>每页:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded border border-border bg-background cursor-pointer"
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Previous button */}
        <button
          className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          disabled={current <= 1}
          onClick={onPrev}
        >
          上一页
        </button>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {pageButtons.map(({ page, label }) => (
            page < 0 ? (
              <span key={`ellipsis-${page}`} className="px-2">
                {label}
              </span>
            ) : (
              <button
                key={page}
                className={`px-3 py-1 rounded border transition-colors ${
                  page === current
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'border-border hover:bg-secondary'
                }`}
                onClick={() => onPageChange?.(page)}
                disabled={page === current}
              >
                {label}
              </button>
            )
          ))}
        </div>

        {/* Next button */}
        <button
          className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          disabled={current >= totalPages}
          onClick={onNext}
        >
          下一页
        </button>

        {/* Go to page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={() => setInputValue(String(current))}
              className="w-16 px-2 py-1 rounded border border-border bg-background text-center"
            />
            <span>页</span>
            <button
              className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleJumpClick}
            >
              跳转
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
