'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Logs } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'

interface OperationLogItem {
  id: string
  operatorId: string | null
  module: string
  action: string
  targetType: string | null
  targetId: string | null
  success: boolean
  errorMessage: string | null
  requestMethod: string | null
  requestPath: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  operator?: {
    id: string
    username: string
    email: string
  } | null
}

type OperationFilter = 'all' | 'success' | 'failed'

// 模块中文映射
const MODULE_LABELS: Record<string, string> = {
  work: '作品互动',
  works: '作品管理',
  users: '用户管理',
  dictionary: '字典管理',
  tags: '标签管理',
  submit: '作品提交',
}

// 动作中文映射
const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  like: '点赞',
  unlike: '取消点赞',
  view: '浏览',
  audit: '审核',
  ban: '封禁',
  unban: '解封',
}

const getModuleLabel = (module: string) => MODULE_LABELS[module] || module
const getActionLabel = (action: string) => ACTION_LABELS[action] || action

export default function OperationLogsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<OperationLogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<OperationFilter>('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [availableModules, setAvailableModules] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { feedback, showFeedback } = useFeedback()

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
        [CRUD_QUERY_PARAMS.filter]: filterMode,
        module: moduleFilter,
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const res = await fetch(`/api/logs/operations?${params.toString()}`)
      if (!res.ok) {
        showFeedback('error', '操作日志加载失败')
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotalItems(data.total || 0)
      if (Array.isArray(data.modules)) {
        setAvailableModules(data.modules)
      }
    } catch (error) {
      console.error('Failed to fetch operation logs:', error)
      showFeedback('error', '操作日志加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, filterMode, moduleFilter, startDate, endDate, showFeedback])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterMode, moduleFilter, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pagedItems = useMemo(() => items, [items])

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">操作日志</h2>
          <p className="text-muted-foreground mt-1">只读查看系统写操作历史</p>
        </div>
      </div>

      <CrudFilterBar
        searchPlaceholder="搜索操作人、作品ID、路径、动作..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterMode}
        filterOptions={[
          { value: 'all', label: '全部结果' },
          { value: 'success', label: '仅成功' },
          { value: 'failed', label: '仅失败' },
        ]}
        onFilterChange={(value) => setFilterMode(value as OperationFilter)}
        filterPlaceholder="筛选结果"
        extraFilters={
          <>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-card border-border">
                <SelectValue placeholder="选择模块" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模块</SelectItem>
                {availableModules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {getModuleLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="开始日期"
                variant="outline"
              />
              <span className="text-muted-foreground">~</span>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="结束日期"
                variant="outline"
              />
            </div>
            {(moduleFilter !== 'all' || startDate || endDate) && (
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setModuleFilter('all')
                  setStartDate('')
                  setEndDate('')
                }}
              >
                重置
              </button>
            )}
          </>
        }
      />

      <div className="space-y-4">
        {pagedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Logs size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {getModuleLabel(item.module)} · {getActionLabel(item.action)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.module}/{item.action}
                    </Badge>
                    <Badge variant={item.success ? 'default' : 'destructive'}>
                      {item.success ? '成功' : '失败'}
                    </Badge>
                    {item.requestMethod && <Badge variant="outline">{item.requestMethod}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 break-all">
                    操作人: {item.operator?.username || '未知'} ({item.operator?.email || '-'})
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 break-all">
                    目标: {item.targetType || '-'} / {item.targetId || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 break-all">
                    路径: {item.requestPath || '-'} · IP: {item.ipAddress || '-'}
                  </div>
                  {!item.success && item.errorMessage && (
                    <div className="text-xs text-red-400 mt-1 break-all">
                      错误: {item.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(item.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </Card>
        ))}
        {pagedItems.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无操作日志
          </div>
        )}
      </div>

      <CrudPagination
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        current={current}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        onPrev={() => setCurrentPage(current - 1)}
        onNext={() => setCurrentPage(current + 1)}
      />
    </div>
  )
}
