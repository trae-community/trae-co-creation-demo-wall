'use client'

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type FilterOption = {
  value: string
  label: string
}

interface CrudFilterBarProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterValue: string
  filterOptions: FilterOption[]
  onFilterChange: (value: string) => void
  filterPlaceholder?: string
  /** 额外筛选控件（如模块下拉、日期范围），与筛选下拉同行展示 */
  extraFilters?: ReactNode
  hasActiveFilters?: boolean
  onReset?: () => void
  resetLabel?: string
  activeFilterLabel?: string
}

export function CrudFilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterValue,
  filterOptions,
  onFilterChange,
  filterPlaceholder = '筛选条件',
  extraFilters,
  hasActiveFilters,
  onReset,
  resetLabel = '重置筛选',
  activeFilterLabel = '已筛选',
}: CrudFilterBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3">
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{activeFilterLabel}</span>
          {onReset && (
            <button type="button" onClick={onReset} className="text-primary hover:underline">
              {resetLabel}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-10 bg-secondary border-border"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
        {filterOptions.length > 0 && (
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {extraFilters}
      </div>
      </div>
    </div>
  )
}
