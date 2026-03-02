'use client'

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
}

export function CrudFilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterValue,
  filterOptions,
  onFilterChange,
  filterPlaceholder = '筛选条件',
}: CrudFilterBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-10 bg-secondary border-border"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Select onValueChange={onFilterChange} defaultValue={filterValue}>
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
      </div>
    </div>
  )
}
