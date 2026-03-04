'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Logs } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useFeedback } from '@/hooks/use-feedback'
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

export default function OperationLogsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<OperationLogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<OperationFilter>('all')
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
        [CRUD_QUERY_PARAMS.filter]: filterMode
      })
      const res = await fetch(`/api/logs/operations?${params.toString()}`)
      if (!res.ok) {
        showFeedback('error', '操作日志加载失败')
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch operation logs:', error)
      showFeedback('error', '操作日志加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, filterMode, showFeedback])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterMode])

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
        searchPlaceholder="搜索模块、动作、目标ID、操作者、路径..."
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
                      {item.module}/{item.action}
                    </span>
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
        onPrev={() => setCurrentPage(current - 1)}
        onNext={() => setCurrentPage(current + 1)}
      />
    </div>
  )
}
