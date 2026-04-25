'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS, type TagFilter } from '@/lib/crud'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LoadingOverlay } from '@/components/common/loading-overlay'

interface WorkTag {
  id: number
  name: string
  isAutoAudit: boolean | null
  auditStartTime: string | null
  auditEndTime: string | null
}

const tagSchema = z.object({
  name: z.string().min(1, '请输入标签名称'),
  isAutoAudit: z.enum(['true', 'false']),
  auditStartDate: z.string().optional(),
  auditStartClock: z.string().optional(),
  auditEndDate: z.string().optional(),
  auditEndClock: z.string().optional(),
})

export default function TagsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [tags, setTags] = useState<WorkTag[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<TagFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<WorkTag | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null)
  const { feedback, showFeedback } = useFeedback()

  const tagForm = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      isAutoAudit: 'false',
      auditStartDate: '',
      auditStartClock: '',
      auditEndDate: '',
      auditEndClock: '',
    }
  })

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
        [CRUD_QUERY_PARAMS.filter]: filterMode
      })
      const res = await fetch(`/api/tags?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTags(data.items || [])
        setTotalItems(data.total || 0)
      } else {
        showFeedback('error', '标签加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      showFeedback('error', '标签加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, filterMode, showFeedback])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const splitDateTime = (value: string | null) => {
    if (!value) {
      return { date: '', time: '' }
    }
    const date = new Date(value)
    const pad = (num: number) => `${num}`.padStart(2, '0')
    const yyyy = date.getFullYear()
    const mm = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const min = pad(date.getMinutes())
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
    }
  }

  const mergeDateTime = (date: string | undefined, time: string | undefined) => {
    if (!date?.trim()) return null
    const dateStr = `${date}T${time?.trim() ? time : '00:00'}`
    const dateObj = new Date(dateStr)
    // If date is invalid, return null or original string (though it shouldn't happen with date inputs)
    if (isNaN(dateObj.getTime())) return null
    return dateObj.toISOString()
  }

  const filteredTags = useMemo(() => tags, [tags])
  const isAutoAuditEnabled = tagForm.watch('isAutoAudit') === 'true'

  const setQuickRange = (offsetHours: number) => {
    const start = new Date()
    const end = new Date(start.getTime() + offsetHours * 60 * 60 * 1000)
    const toDate = (date: Date) => {
      const pad = (num: number) => `${num}`.padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }
    const toTime = (date: Date) => {
      const pad = (num: number) => `${num}`.padStart(2, '0')
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    tagForm.setValue('auditStartDate', toDate(start), { shouldDirty: true })
    tagForm.setValue('auditStartClock', toTime(start), { shouldDirty: true })
    tagForm.setValue('auditEndDate', toDate(end), { shouldDirty: true })
    tagForm.setValue('auditEndClock', toTime(end), { shouldDirty: true })
  }

  const clearRange = () => {
    tagForm.setValue('auditStartDate', '', { shouldDirty: true })
    tagForm.setValue('auditStartClock', '', { shouldDirty: true })
    tagForm.setValue('auditEndDate', '', { shouldDirty: true })
    tagForm.setValue('auditEndClock', '', { shouldDirty: true })
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterMode])

  useEffect(() => {
    if (!isAutoAuditEnabled) {
      tagForm.setValue('auditStartDate', '', { shouldDirty: true })
      tagForm.setValue('auditStartClock', '', { shouldDirty: true })
      tagForm.setValue('auditEndDate', '', { shouldDirty: true })
      tagForm.setValue('auditEndClock', '', { shouldDirty: true })
    }
  }, [isAutoAuditEnabled, tagForm])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pagedTags = filteredTags

  const openCreateDialog = () => {
    setEditingTag(null)
    tagForm.reset({
      name: '',
      isAutoAudit: 'false',
      auditStartDate: '',
      auditStartClock: '',
      auditEndDate: '',
      auditEndClock: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (tag: WorkTag) => {
    const start = splitDateTime(tag.auditStartTime)
    const end = splitDateTime(tag.auditEndTime)
    setEditingTag(tag)
    tagForm.reset({
      name: tag.name,
      isAutoAudit: tag.isAutoAudit ? 'true' : 'false',
      auditStartDate: start.date,
      auditStartClock: start.time,
      auditEndDate: end.date,
      auditEndClock: end.time,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof tagSchema>) => {
    try {
      setIsSaving(true)
      const body = {
        id: editingTag?.id,
        name: values.name,
        isAutoAudit: values.isAutoAudit === 'true',
        auditStartTime: mergeDateTime(values.auditStartDate, values.auditStartClock),
        auditEndTime: mergeDateTime(values.auditEndDate, values.auditEndClock),
      }
      const res = await fetch('/api/tags', {
        method: editingTag ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setIsDialogOpen(false)
        tagForm.reset()
        setEditingTag(null)
        fetchTags()
        showFeedback('success', editingTag ? '标签已更新' : '标签已创建')
      } else {
        showFeedback('error', '标签保存失败')
      }
    } catch (error) {
      console.error('Failed to save tag:', error)
      showFeedback('error', '标签保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该标签吗？')) return
    try {
      setDeletingTagId(id)
      const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTags()
        showFeedback('success', '标签已删除')
      } else {
        showFeedback('error', '标签删除失败')
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
      showFeedback('error', '标签删除失败')
    } finally {
      setDeletingTagId(null)
    }
  }

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">标签管理</h2>
          <p className="text-muted-foreground mt-1">管理作品标签与自动过审规则</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          新建标签
        </Button>
      </div>

      <CrudFilterBar
        searchPlaceholder="搜索标签名称..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterMode}
        filterOptions={[
          { value: 'all', label: '全部标签' },
          { value: 'auto', label: '自动过审' },
          { value: 'manual', label: '手动审核' },
        ]}
        onFilterChange={(val) => setFilterMode(val as TagFilter)}
        filterPlaceholder="筛选标签"
      />

      <div className="space-y-4">
        {pagedTags.map(tag => (
          <Card key={tag.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Tag size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{tag.name}</span>
                    {tag.isAutoAudit && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        自动过审
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tag.auditStartTime || tag.auditEndTime ? (
                      <>
                        {tag.auditStartTime ? `开始：${new Date(tag.auditStartTime).toLocaleString('zh-CN')}` : '开始：未设置'}
                        {' · '}
                        {tag.auditEndTime ? `结束：${new Date(tag.auditEndTime).toLocaleString('zh-CN')}` : '结束：未设置'}
                      </>
                    ) : (
                      '未配置自动过审时间'
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(tag)}>
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleDelete(tag.id)}
                  disabled={deletingTagId === tag.id}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {pagedTags.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无标签，点击右上角添加
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
            <DialogDescription>
              可选配置自动过审时间，留空则不启用
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={tagForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标签名称</label>
              <Input {...tagForm.register('name')} placeholder="例如：社区推荐" className="bg-background border-border" />
              {tagForm.formState.errors.name && <p className="text-red-500 text-xs">{tagForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">是否开启自动过审</label>
              <Select
                onValueChange={(val) => tagForm.setValue('isAutoAudit', val as 'true' | 'false', { shouldDirty: true })}
                value={tagForm.watch('isAutoAudit')}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">关闭</SelectItem>
                  <SelectItem value="true">开启</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">自动过审开始时间</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    {...tagForm.register('auditStartDate')}
                    className="bg-background border-border"
                    disabled={!isAutoAuditEnabled}
                    onFocus={(event) => event.currentTarget.showPicker?.()}
                  />
                  <Input
                    type="time"
                    {...tagForm.register('auditStartClock')}
                    className="bg-background border-border w-36"
                    disabled={!isAutoAuditEnabled}
                    onFocus={(event) => event.currentTarget.showPicker?.()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">自动过审结束时间</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    {...tagForm.register('auditEndDate')}
                    className="bg-background border-border"
                    disabled={!isAutoAuditEnabled}
                    onFocus={(event) => event.currentTarget.showPicker?.()}
                  />
                  <Input
                    type="time"
                    {...tagForm.register('auditEndClock')}
                    className="bg-background border-border w-36"
                    disabled={!isAutoAuditEnabled}
                    onFocus={(event) => event.currentTarget.showPicker?.()}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickRange(24)} disabled={!isAutoAuditEnabled}>
                当前时间起24小时
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickRange(168)} disabled={!isAutoAuditEnabled}>
                当前时间起7天
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearRange} disabled={!isAutoAuditEnabled}>
                清空时间
              </Button>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? '处理中...' : editingTag ? '保存修改' : '立即创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
