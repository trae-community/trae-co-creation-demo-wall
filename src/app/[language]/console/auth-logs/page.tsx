'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, AlertTriangle, Ban } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BATCH_BAN_CONFIRM_PHRASE,
  BATCH_BAN_ROOT_ONLY_MIN,
  BATCH_BAN_TYPED_CONFIRM_MIN,
} from '@/lib/admin-risk'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { Link, useRouter } from '@/lib/language/navigation'
import { cn } from '@/lib/utils'

interface AuthLogItem {
  id: string
  userId: string | null
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

interface IpSignupStatItem {
  ipAddress: string
  signupCount: number
  lastSignupAt: string
  userIds: string[]
  usernames: string[]
}

type AuthLogFilter = 'all' | 'sign_in' | 'sign_up'
type ViewMode = 'logs' | 'ip-stats'

export default function AuthLogsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('logs')
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<AuthLogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('ip') || '')
  const [filterUserId, setFilterUserId] = useState(() => searchParams.get('userId') || '')
  const [filterIp, setFilterIp] = useState(() => searchParams.get('ip') || '')
  const [filterMode, setFilterMode] = useState<AuthLogFilter>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const { feedback, showFeedback } = useFeedback()

  const [ipStats, setIpStats] = useState<IpSignupStatItem[]>([])
  const [ipStatsDays, setIpStatsDays] = useState(7)
  const [ipStatsMinCount, setIpStatsMinCount] = useState(3)
  const [selectedIpUserIds, setSelectedIpUserIds] = useState<string[]>([])
  const [batchBanOpen, setBatchBanOpen] = useState(false)
  const [isBatchBanning, setIsBatchBanning] = useState(false)
  const [batchBanIp, setBatchBanIp] = useState<string | null>(null)
  const [batchBanReason, setBatchBanReason] = useState('')
  const [batchBanConfirmText, setBatchBanConfirmText] = useState('')
  const [isRootOperator, setIsRootOperator] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const codes: string[] = (data?.profile?.roles ?? []).map(
          (r: { roleCode: string }) => r.roleCode
        )
        setIsRootOperator(codes.includes('root'))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const userId = searchParams.get('userId') || ''
    const ip = searchParams.get('ip') || ''
    setFilterUserId(userId)
    setFilterIp(ip)
    if (ip) {
      setSearchTerm(ip)
    }
    if (userId || ip) {
      setViewMode('logs')
      setCurrentPage(1)
    }
  }, [searchParams])

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
        [CRUD_QUERY_PARAMS.filter]: filterMode,
      })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const userIdParam = filterUserId || searchParams.get('userId') || ''
      const ipParam = filterIp || searchParams.get('ip') || ''
      if (userIdParam) params.append('userId', userIdParam)
      if (ipParam) params.append('ip', ipParam)
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
  }, [
    currentPage,
    pageSize,
    searchTerm,
    filterMode,
    startDate,
    endDate,
    filterUserId,
    filterIp,
    searchParams,
    showFeedback,
  ])

  const fetchIpStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        days: String(ipStatsDays),
        minCount: String(ipStatsMinCount),
      })
      const res = await fetch(`/api/logs/auth/ip-stats?${params.toString()}`)
      if (!res.ok) {
        showFeedback('error', 'IP 统计加载失败')
        return
      }
      const data = await res.json()
      setIpStats(data.items || [])
    } catch (error) {
      console.error('Failed to fetch IP stats:', error)
      showFeedback('error', 'IP 统计加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [ipStatsDays, ipStatsMinCount, showFeedback])

  useEffect(() => {
    if (viewMode === 'logs') fetchLogs()
    else fetchIpStats()
  }, [viewMode, fetchLogs, fetchIpStats])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterMode, startDate, endDate, filterUserId, filterIp])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pagedItems = useMemo(() => items, [items])

  const openIpLogs = (ip: string) => {
    setViewMode('logs')
    setFilterIp(ip)
    setSearchTerm(ip)
    setFilterUserId('')
    setFilterMode('sign_up')
  }

  const clearLogFilters = () => {
    setSearchTerm('')
    setFilterMode('all')
    setStartDate('')
    setEndDate('')
    setFilterUserId('')
    setFilterIp('')
    setCurrentPage(1)
    if (searchParams.get('userId') || searchParams.get('ip')) {
      router.replace('/console/auth-logs')
    }
  }

  const openBatchBan = (stat: IpSignupStatItem) => {
    setBatchBanIp(stat.ipAddress)
    setSelectedIpUserIds(stat.userIds)
    setBatchBanReason('')
    setBatchBanConfirmText('')
    setBatchBanOpen(true)
  }

  const batchBanNeedsTypedConfirm =
    selectedIpUserIds.length >= BATCH_BAN_TYPED_CONFIRM_MIN
  const batchBanNeedsRoot = selectedIpUserIds.length >= BATCH_BAN_ROOT_ONLY_MIN
  const batchBanReasonOk = batchBanReason.trim().length >= 2
  const batchBanConfirmOk =
    !batchBanNeedsTypedConfirm || batchBanConfirmText.trim() === BATCH_BAN_CONFIRM_PHRASE
  const batchBanCanSubmit =
    batchBanReasonOk &&
    batchBanConfirmOk &&
    (!batchBanNeedsRoot || isRootOperator)

  const confirmBatchBan = async () => {
    if (selectedIpUserIds.length === 0 || !batchBanCanSubmit) return
    try {
      setIsBatchBanning(true)
      const res = await fetch('/api/users/batch-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIpUserIds,
          banned: true,
          reason: batchBanReason.trim(),
          sourceIp: batchBanIp,
        }),
      })
      if (res.ok) {
        showFeedback('success', `已封禁 ${selectedIpUserIds.length} 个用户`)
        setBatchBanOpen(false)
        fetchIpStats()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '批量封禁失败')
      }
    } catch {
      showFeedback('error', '批量封禁失败')
    } finally {
      setIsBatchBanning(false)
    }
  }

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">登录注册日志</h2>
          <p className="text-muted-foreground mt-1">查看登录注册记录与同 IP 批量注册风险</p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 gap-0.5">
          {[
            { key: 'logs' as const, label: '日志列表' },
            { key: 'ip-stats' as const, label: '可疑 IP' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'logs' && (
        <>
          {(filterUserId || filterIp) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">当前筛选：</span>
              {filterUserId && (
                <Badge variant="outline">用户 ID {filterUserId}</Badge>
              )}
              {filterIp && <Badge variant="outline">IP {filterIp}</Badge>}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={clearLogFilters}
              >
                清除
              </button>
            </div>
          )}

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
            extraFilters={
              <>
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
                {(startDate || endDate) && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                    }}
                  >
                    重置日期
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
                      <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.user?.id ? (
                          <Link
                            href={`/user/${item.user.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {item.user.username}
                          </Link>
                        ) : (
                          <span className="font-semibold">未知用户</span>
                        )}
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
                        IP:{' '}
                        {item.ipAddress ? (
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => openIpLogs(item.ipAddress!)}
                          >
                            {item.ipAddress}
                          </button>
                        ) : (
                          '-'
                        )}
                        {' · '}
                        UA: {item.userAgent || '-'}
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
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
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
            onPageChange={(page) => setCurrentPage(page)}
            onPrev={() => setCurrentPage(current - 1)}
            onNext={() => setCurrentPage(current + 1)}
          />
        </>
      )}

      {viewMode === 'ip-stats' && (
        <>
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <span className="text-sm text-muted-foreground">统计近</span>
            <select
              className="rounded-md border border-border bg-secondary px-2 py-1.5 text-sm"
              value={ipStatsDays}
              onChange={(e) => setIpStatsDays(Number(e.target.value))}
            >
              {[7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>{d} 天</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">内注册 ≥</span>
            <select
              className="rounded-md border border-border bg-secondary px-2 py-1.5 text-sm"
              value={ipStatsMinCount}
              onChange={(e) => setIpStatsMinCount(Number(e.target.value))}
            >
              {[2, 3, 5, 10].map((n) => (
                <option key={n} value={n}>{n} 次</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">的 IP</span>
            <Button variant="outline" size="sm" onClick={() => fetchIpStats()}>
              刷新
            </Button>
          </div>

          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            这里按「同一 IP 注册次数」找异常。IP 不准时名单会失真，批量封禁前请再核对用户是否正常。
          </div>

          <div className="space-y-3">
            {ipStats.map((stat) => (
              <Card key={stat.ipAddress} className="border-border bg-card/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="font-mono font-semibold text-primary hover:underline"
                        onClick={() => openIpLogs(stat.ipAddress)}
                      >
                        {stat.ipAddress}
                      </button>
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {stat.signupCount} 次注册
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      最近注册: {new Date(stat.lastSignupAt).toLocaleString('zh-CN')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stat.userIds.map((uid, i) => (
                        <Link
                          key={uid}
                          href={`/user/${uid}`}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {stat.usernames[i] || uid}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 hover:text-red-500 hover:border-red-500/40"
                    onClick={() => openBatchBan(stat)}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    批量封禁
                  </Button>
                </div>
              </Card>
            ))}
            {ipStats.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                当前条件下暂无可疑 IP
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={batchBanOpen} onOpenChange={setBatchBanOpen}>
        <DialogContent className="bg-card border border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量封禁用户</DialogTitle>
            <DialogDescription>
              IP {batchBanIp} 下共 {selectedIpUserIds.length} 个账号将被封禁，封禁后无法登录。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto space-y-2 py-2">
            {selectedIpUserIds.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <Checkbox checked disabled />
                <span className="font-mono text-muted-foreground">{id}</span>
              </label>
            ))}
          </div>
          {batchBanNeedsRoot && !isRootOperator && (
            <p className="text-sm text-destructive">
              批量封禁 {BATCH_BAN_ROOT_ONLY_MIN} 人及以上需超级管理员执行。
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="batch-ban-reason">封禁原因（必填，将写入操作日志）</Label>
            <Textarea
              id="batch-ban-reason"
              value={batchBanReason}
              onChange={(e) => setBatchBanReason(e.target.value)}
              placeholder="例如：同 IP 批量注册、疑似刷赞关联账号"
              rows={3}
              className="resize-none"
            />
          </div>
          {batchBanNeedsTypedConfirm && (
            <div className="space-y-2">
              <Label htmlFor="batch-ban-confirm">
                请输入「{BATCH_BAN_CONFIRM_PHRASE}」以继续（{selectedIpUserIds.length} 人）
              </Label>
              <Input
                id="batch-ban-confirm"
                value={batchBanConfirmText}
                onChange={(e) => setBatchBanConfirmText(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchBanOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={confirmBatchBan}
              disabled={isBatchBanning || selectedIpUserIds.length === 0 || !batchBanCanSubmit}
            >
              {isBatchBanning ? '封禁中...' : '确认封禁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
