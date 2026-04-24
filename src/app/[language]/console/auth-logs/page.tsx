'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useFeedback } from '@/hooks/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'

interface AuthLogItem {
  id: string
  userId: string | null
  clerkId: string | null
  authType: 'sign_in' | 'sign_up' | string
  authChannel: string | null
  authStatus: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    id: string
    username: string
    email: string
  } | null
}

type AuthLogFilter = 'all' | 'sign_in' | 'sign_up'

export default function AuthLogsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<AuthLogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<AuthLogFilter>('all')
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
      const res = await fetch(`/api/logs/auth?${params.toString()}`)
      if (!res.ok) {
        showFeedback('error', '认证日志加载失败')
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch auth logs:', error)
      showFeedback('error', '认证日志加载失败')
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
          <h2 className="text-2xl font-bold tracking-tight">登录注册日志</h2>
          <p className="text-muted-foreground mt-1">只读查看用户登录与注册记录</p>
        </div>
      </div>

      <CrudFilterBar
        searchPlaceholder="搜索用户名、邮箱、IP..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterMode}
        filterOptions={[
          { value: 'all', label: '全部行为' },
          { value: 'sign_in', label: '仅登录' },
          { value: 'sign_up', label: '仅注册' },
        ]}
        onFilterChange={(value) => setFilterMode(value as AuthLogFilter)}
        filterPlaceholder="筛选行为"
      />

      <div className="space-y-4">
        {pagedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {item.user?.username || '未知用户'}
                    </span>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                      {item.authType === 'sign_up' ? '注册' : '登录'}
                    </Badge>
                    <Badge variant="outline">{item.authChannel || 'credentials'}</Badge>
                    <Badge variant={item.authStatus === 'success' ? 'default' : 'destructive'}>
                      {item.authStatus}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 break-all">
                    {item.user?.email || '无邮箱'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 break-all">
                    IP: {item.ipAddress || '-'} · UA: {item.userAgent || '-'}
                  </div>
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
            暂无认证日志
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
