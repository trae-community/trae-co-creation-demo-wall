'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Trash2, Eye, Calendar, User, ExternalLink, Search, ShieldCheck, Clock, History, Pencil } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { ConsoleFilterCard } from '@/components/crud/console-filter-card'
import { ListEmptyState } from '@/components/common/list-empty-state'
import { ListRowSkeleton } from '@/components/common/list-row-skeleton'
import { Link, usePathname } from '@/lib/language/navigation'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PosterImage } from '@/components/work/poster-image'
import { PosterEditDialog } from '@/components/work/poster-edit-dialog'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  BATCH_AUDIT_CONFIRM_PHRASE,
  BATCH_AUDIT_TYPED_CONFIRM_MIN,
} from '@/lib/admin-risk'

interface PosterAdminItem {
  id: string
  nickname: string
  description: string | null
  imageUrl: string
  demoUrl: string
  auditStatus: number
  tags: string[] | null
  createdAt: string
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
}

const AUDIT_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '2', label: '已拒绝' },
]

export function PostersManagement() {
  const router = useRouter()
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tConsole = useTranslations('Console')

  const [isLoading, setIsLoading] = useState(false)
  const [posters, setPosters] = useState<PosterAdminItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [auditFilter, setAuditFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingPoster, setViewingPoster] = useState<PosterAdminItem | null>(null)
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false)
  const [auditTargetIds, setAuditTargetIds] = useState<string[]>([])
  const [selectedAuditStatus, setSelectedAuditStatus] = useState('1')
  const [auditReason, setAuditReason] = useState('')
  const [auditConfirmText, setAuditConfirmText] = useState('')
  const [isSavingAudit, setIsSavingAudit] = useState(false)
  const [selectedPosterIds, setSelectedPosterIds] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [posterToDelete, setPosterToDelete] = useState<PosterAdminItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPoster, setEditingPoster] = useState<PosterAdminItem | null>(null)

  const { feedback, showFeedback } = useFeedback()

  // Fetch posters
  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })
      if (auditFilter) params.append('auditStatus', auditFilter)
      if (selectedDate) params.append('date', selectedDate)
      if (sortBy !== 'newest') params.append('sort', sortBy)

      const res = await fetch(`/api/console/posters?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPosters(data.items || [])
        setTotalItems(data.total || 0)
      } else {
        showFeedback('error', '海报列表加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch posters:', error)
      showFeedback('error', '海报列表加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, auditFilter, selectedDate, sortBy, showFeedback])

  useEffect(() => {
    const status = searchParams.get('auditStatus')
    if (status === '0' || status === '1' || status === '2') {
      setAuditFilter(status)
    }
  }, [searchParams])

  useEffect(() => {
    fetchPosters()
  }, [fetchPosters])

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, auditFilter, selectedDate, sortBy])

  // Handlers
  const handleView = (poster: PosterAdminItem) => {
    setViewingPoster(poster)
    setIsViewDialogOpen(true)
  }

  const handleOpenAuditDialog = (poster: PosterAdminItem) => {
    setAuditTargetIds([poster.id])
    setSelectedAuditStatus(String(poster.auditStatus))
    setAuditReason('')
    setAuditConfirmText('')
    setIsAuditDialogOpen(true)
  }

  const handleTogglePosterSelection = (posterId: string, checked: boolean) => {
    setSelectedPosterIds(prev =>
      checked ? [...prev, posterId] : prev.filter(id => id !== posterId)
    )
  }

  const handleToggleSelectAllPosters = (checked: boolean) => {
    if (checked) {
      setSelectedPosterIds(posters.map(poster => poster.id))
      return
    }
    setSelectedPosterIds([])
  }

  const handleOpenBulkAuditDialog = () => {
    if (selectedPosterIds.length === 0) {
      showFeedback('error', '请先选择要审核的海报')
      return
    }
    setAuditTargetIds(selectedPosterIds)
    setSelectedAuditStatus('0')
    setAuditReason('')
    setAuditConfirmText('')
    setIsAuditDialogOpen(true)
  }

  const auditStatusNum = Number(selectedAuditStatus)
  const auditNeedsRejectReason = auditStatusNum === 2
  const auditNeedsTypedConfirm = auditTargetIds.length >= BATCH_AUDIT_TYPED_CONFIRM_MIN
  const auditRejectReasonOk = !auditNeedsRejectReason || auditReason.trim().length >= 2
  const auditConfirmOk =
    !auditNeedsTypedConfirm || auditConfirmText.trim() === BATCH_AUDIT_CONFIRM_PHRASE
  const auditCanSubmit = auditRejectReasonOk && auditConfirmOk

  const handleSaveAudit = async () => {
    if (auditTargetIds.length === 0 || !auditCanSubmit) return
    const updatedCount = auditTargetIds.length
    try {
      setIsSavingAudit(true)
      const isBatchAudit = updatedCount > 1
      const res = await fetch('/api/console/posters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isBatchAudit ? { ids: auditTargetIds } : { id: auditTargetIds[0] }),
          auditStatus: Number(selectedAuditStatus),
          auditReason: auditReason.trim() || undefined,
        }),
      })
      if (res.ok) {
        setIsAuditDialogOpen(false)
        setAuditTargetIds([])
        setSelectedPosterIds([])
        fetchPosters()
        showFeedback(
          'success',
          isBatchAudit
            ? `已批量更新 ${updatedCount} 个海报的审核状态`
            : selectedAuditStatus === '1'
              ? '海报审核已通过'
              : selectedAuditStatus === '2'
                ? '海报已拒绝'
                : '海报审核状态已更新'
        )
      } else {
        const errorData = await res.json().catch(() => ({}))
        showFeedback('error', errorData.error || '更新审核状态失败')
      }
    } catch (error) {
      console.error('Failed to save audit status:', error)
      showFeedback('error', '更新审核状态失败')
    } finally {
      setIsSavingAudit(false)
    }
  }

  const handleOpenDeleteDialog = (poster: PosterAdminItem) => {
    setPosterToDelete(poster)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!posterToDelete) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/posters/${posterToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setIsDeleteDialogOpen(false)
        fetchPosters()
        showFeedback('success', '海报已删除')
      } else {
        const data = await res.json().catch(() => ({}))
        showFeedback('error', data.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete poster:', error)
      showFeedback('error', '删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const isAllCurrentPageSelected = posters.length > 0 && posters.every(poster => selectedPosterIds.includes(poster.id))
  const isPartiallySelected = posters.some(poster => selectedPosterIds.includes(poster.id)) && !isAllCurrentPageSelected
  const auditTargetPoster = auditTargetIds.length === 1
    ? posters.find(poster => poster.id === auditTargetIds[0])
    : null

  const postersFiltersActive =
    Boolean(searchTerm) || Boolean(auditFilter) || Boolean(selectedDate) || sortBy !== 'newest'

  const resetPostersFilters = () => {
    setSearchTerm('')
    setAuditFilter('')
    setSelectedDate('')
    setSortBy('newest')
  }

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <CrudFeedback feedback={feedback} />

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">海报管理</h2>
          <p className="text-muted-foreground mt-1">管理海报提交信息及审核状态</p>
        </div>
      </div>

      <ConsoleFilterCard
        hasActiveFilters={postersFiltersActive}
        onReset={resetPostersFilters}
        activeLabel={tConsole('filterActive')}
        resetLabel={tConsole('filterReset')}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="搜索昵称、描述..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort tabs + Date picker — 与作品管理统一风格 */}
          <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5 shrink-0">
            {[
              { key: 'newest' as const, icon: <Clock className="w-3 h-3" />, label: '最新' },
              { key: 'oldest' as const, icon: <History className="w-3 h-3" />, label: '最早' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                  sortBy === key
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                )}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            <div className="w-px h-4 bg-border mx-0.5" />

            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="日期"
              className="shrink-0"
            />
          </div>
        </div>

        {/* 审核状态筛选 + 重置（pill 样式与 CityFilter 一致） */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium w-10 shrink-0 select-none">审核</span>
          {AUDIT_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAuditFilter(opt.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-all duration-200 shrink-0 active:scale-95",
                auditFilter === opt.value
                  ? "bg-gradient-to-r from-[#32F08C] to-[#17D479] text-black font-bold border-transparent shadow-[0_0_12px_rgba(50,240,140,0.25)]"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </ConsoleFilterCard>

      <div className="space-y-4">
        {isLoading && posters.length === 0 ? (
          <ListRowSkeleton rows={6} />
        ) : (
          <>
        {posters.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all-posters"
                checked={isAllCurrentPageSelected ? true : isPartiallySelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => handleToggleSelectAllPosters(checked === true)}
              />
              <Label htmlFor="select-all-posters" className="cursor-pointer">
                本页全选
              </Label>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedPosterIds.length} 个海报
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPosterIds([])}
                disabled={selectedPosterIds.length === 0}
              >
                清空选择
              </Button>
              <Button
                size="sm"
                onClick={handleOpenBulkAuditDialog}
                disabled={selectedPosterIds.length === 0}
              >
                批量审核
              </Button>
            </div>
          </div>
        )}

        {posters.map(poster => (
          <Card key={poster.id} className="overflow-hidden border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex">
              <div className="flex items-start border-r border-border/50 p-4">
                <Checkbox
                  id={`poster-select-${poster.id}`}
                  checked={selectedPosterIds.includes(poster.id)}
                  onCheckedChange={(checked) => handleTogglePosterSelection(poster.id, checked === true)}
                  aria-label={`选择海报 ${poster.nickname}`}
                />
              </div>
            <div className="flex flex-1 flex-col sm:flex-row">
              {/* 封面缩略图 */}
              <div className="w-full sm:w-48 h-40 sm:h-auto bg-muted shrink-0 relative">
                <img
                  src={poster.imageUrl}
                  alt={poster.nickname}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 z-10">
                  <Badge
                    variant={poster.auditStatus === 1 ? 'default' : poster.auditStatus === 2 ? 'destructive' : 'secondary'}
                    className="shadow-sm"
                  >
                    {AUDIT_STATUS_OPTIONS.find(s => s.value === String(poster.auditStatus))?.label || '待审核'}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className="font-semibold text-lg line-clamp-1 hover:text-primary cursor-pointer transition-colors"
                        title={poster.nickname}
                        onClick={() => handleView(poster)}
                      >
                        {poster.nickname}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1" title="提交者">
                          <User size={14} />
                          <Link
                            href={`/user/${poster.user.id}?from=${encodeURIComponent(pathname)}`}
                            className="hover:text-primary transition-colors"
                          >
                            {poster.user.username}
                          </Link>
                        </div>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1" title="创建时间">
                          <Calendar size={14} />
                          <span>{new Date(poster.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons（与作品管理同款 ghost icon 按钮） */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-green-400 hover:bg-green-500/10"
                        onClick={() => router.push(`/${locale}/posters/${poster.id}`)}
                        title="查看详情页"
                        aria-label="查看详情页"
                      >
                        <ExternalLink size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-indigo-500 hover:bg-indigo-500/10"
                        onClick={() => handleView(poster)}
                        title="查看海报"
                        aria-label="查看海报"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={() => { setEditingPoster(poster); setIsEditDialogOpen(true) }}
                        title="编辑海报"
                        aria-label="编辑海报"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10"
                        onClick={() => handleOpenAuditDialog(poster)}
                        title="审核海报"
                        aria-label="审核海报"
                      >
                        <ShieldCheck size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleOpenDeleteDialog(poster)}
                        title="删除海报"
                        aria-label="删除海报"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {poster.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2" title={poster.description}>
                      {poster.description}
                    </p>
                  )}
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                  {Array.isArray(poster.tags) && poster.tags.map((tag, idx) => (
                    <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs bg-secondary/50">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </Card>
        ))}

        {posters.length === 0 && (
          <ListEmptyState title={tConsole('empty.noPosters')} />
        )}
          </>
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

      {/* 查看海报弹窗（展示最终合成海报） */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingPoster?.nickname || '查看海报'}</DialogTitle>
            <DialogDescription>最终合成海报（封面 + 昵称 + 简介 + 二维码）</DialogDescription>
          </DialogHeader>
          {viewingPoster && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border" style={{ aspectRatio: '283.46/425.2' }}>
                <PosterImage
                  nickname={viewingPoster.nickname}
                  description={viewingPoster.description}
                  imageUrl={viewingPoster.imageUrl}
                  demoUrl={viewingPoster.demoUrl}
                  qrText="扫码体验"
                  fallbackTitle={viewingPoster.nickname}
                  anonymousLabel={viewingPoster.nickname}
                />
              </div>
              <a
                href={viewingPoster.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                <ExternalLink size={14} className="shrink-0" />
                <span className="truncate">{viewingPoster.demoUrl}</span>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 审核弹窗（与作品管理审核交互一致） */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>审核海报</DialogTitle>
            <DialogDescription>
              {auditTargetIds.length > 1
                ? `批量更新 ${auditTargetIds.length} 个海报的审核状态。审核通过后海报将展示在橱窗。`
                : auditTargetPoster
                  ? `更改海报「${auditTargetPoster.nickname}」的审核状态。审核通过后海报将展示在橱窗。`
                  : '更改已选海报的审核状态。审核通过后海报将展示在橱窗。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>审核状态</Label>
              <Select value={selectedAuditStatus} onValueChange={setSelectedAuditStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择审核状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">待审核</SelectItem>
                  <SelectItem value="1">通过</SelectItem>
                  <SelectItem value="2">拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>审核意见{auditNeedsRejectReason ? '（拒绝时必填）' : '（选填）'}</Label>
              <Textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder={auditNeedsRejectReason ? '请说明拒绝原因' : '请输入审核意见（选填）'}
                rows={3}
                className="resize-none"
              />
            </div>
            {auditNeedsTypedConfirm && (
              <div className="space-y-2">
                <Label>
                  请输入「{BATCH_AUDIT_CONFIRM_PHRASE}」以继续（{auditTargetIds.length} 条）
                </Label>
                <Input
                  value={auditConfirmText}
                  onChange={(e) => setAuditConfirmText(e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAuditDialogOpen(false)} disabled={isSavingAudit}>取消</Button>
            <Button onClick={handleSaveAudit} disabled={isSavingAudit || !auditCanSubmit}>
              {isSavingAudit ? '保存中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <PosterEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        poster={editingPoster}
        onSuccess={() => { fetchPosters(); setEditingPoster(null) }}
      />

      {/* 删除弹窗（与作品管理删除交互一致） */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>删除海报</DialogTitle>
            <DialogDescription>
              确定要删除海报「{posterToDelete?.nickname}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
