'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, Gift, Mail, RotateCcw, Search, User } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { Link, usePathname } from '@/lib/language/navigation'
import { useFeedback } from '@/lib/use-feedback'

type WordSetRow = {
  theme: string
  function: string
  style: string
  drawnAt: string
}

type WordSetRowOptional = WordSetRow & { drawnAt: string | null }

interface BlindBoxDrawItem {
  id: string
  userId: string
  username: string
  email: string
  set1: WordSetRow
  set2: WordSetRowOptional | null
  chosenSlot: number | null
  confirmed: boolean
  workId: string | null
  workTitle: string | null
}

function formatWordSet(set: Pick<WordSetRow, 'theme' | 'function' | 'style'>) {
  return `${set.theme} / ${set.function} / ${set.style}`
}

export default function CodeBlindBoxConsolePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<BlindBoxDrawItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<BlindBoxDrawItem | null>(null)
  const pageSize = 10
  const pathname = usePathname()
  const { feedback, showFeedback } = useFeedback()

  const fetchDraws = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })
      const res = await fetch(`/api/console/code-blind-box?${params.toString()}`)
      if (!res.ok) {
        showFeedback('error', '盲盒记录加载失败')
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch blind box draws:', error)
      showFeedback('error', '盲盒记录加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, showFeedback])

  useEffect(() => {
    fetchDraws()
  }, [fetchDraws])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const confirmReset = useCallback(async () => {
    if (!resetTarget) return
    try {
      setResettingUserId(resetTarget.userId)
      const res = await fetch(`/api/console/code-blind-box?userId=${resetTarget.userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showFeedback('error', body.error || '重置失败')
        return
      }
      showFeedback('success', '已重置该用户的盲盒记录')
      setResetTarget(null)
      await fetchDraws()
    } catch (error) {
      console.error('Failed to reset blind box:', error)
      showFeedback('error', '重置失败')
    } finally {
      setResettingUserId(null)
    }
  }, [resetTarget, fetchDraws, showFeedback])

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">盲盒管理</h2>
          <p className="text-muted-foreground mt-1">查看用户抽卡记录与命题确认状态</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="搜索用户 ID、用户名、邮箱..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden border border-border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift size={18} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/user/${item.userId}?from=${encodeURIComponent(pathname)}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {item.username}
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono">ID {item.userId}</span>
                      {item.chosenSlot != null ? (
                        <Badge>已确认 · 第 {item.chosenSlot} 套</Badge>
                      ) : (
                        <Badge variant="outline">未确认</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={14} />
                        {item.email}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                      <div className="text-xs text-muted-foreground mb-1">第 1 套命题</div>
                      <div className="leading-relaxed">{formatWordSet(item.set1)}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.set1.drawnAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                      <div className="text-xs text-muted-foreground mb-1">第 2 套命题</div>
                      {item.set2 ? (
                        <>
                          <div className="leading-relaxed">{formatWordSet(item.set2)}</div>
                          {item.set2.drawnAt && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(item.set2.drawnAt).toLocaleString('zh-CN')}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {item.workId && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <User size={12} />
                      关联作品 {item.workId}
                      {item.workTitle ? ` · ${item.workTitle}` : ''}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 self-start"
                disabled={resettingUserId === item.userId}
                onClick={() => setResetTarget(item)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                重置
              </Button>
            </div>
          </Card>
        ))}

        {items.length === 0 && !isLoading && (
          <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无盲盒抽取记录
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

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>重置盲盒记录</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground pt-1">
                <p>
                  将删除用户「{resetTarget?.username || resetTarget?.userId}」的抽卡与命题确认数据，对方可重新抽卡。
                </p>
                <p className="text-amber-600/90 dark:text-amber-400/90">
                  此操作不可恢复，请再次确认是否继续。
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetTarget(null)}
              disabled={resettingUserId === resetTarget?.userId}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReset}
              disabled={resettingUserId === resetTarget?.userId}
            >
              {resettingUserId === resetTarget?.userId ? '重置中…' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
