'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

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

interface WorkTag {
  id: number
  name: string
  isAutoAudit: boolean | null
  auditStartTime: string | null
  auditEndTime: string | null
}

const tagSchema = z.object({
  name: z.string().min(1, '请输入标签名称'),
  isAutoAudit: z.enum(['true', 'false']).default('false'),
  auditStartTime: z.string().optional(),
  auditEndTime: z.string().optional(),
})

export default function TagsPage() {
  const [tags, setTags] = useState<WorkTag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<WorkTag | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tagForm = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      isAutoAudit: 'false',
      auditStartTime: '',
      auditEndTime: '',
    }
  })

  const showFeedback = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setFeedback({ type, message })
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500)
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        setTags(data)
      } else {
        showFeedback('error', '标签加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      showFeedback('error', '标签加载失败')
    }
  }, [showFeedback])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const formatDateValue = (value: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    const pad = (num: number) => `${num}`.padStart(2, '0')
    const yyyy = date.getFullYear()
    const mm = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const min = pad(date.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  const filteredTags = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return tags
    return tags.filter(tag => tag.name.toLowerCase().includes(keyword))
  }, [tags, searchTerm])

  const openCreateDialog = () => {
    setEditingTag(null)
    tagForm.reset({
      name: '',
      isAutoAudit: 'false',
      auditStartTime: '',
      auditEndTime: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (tag: WorkTag) => {
    setEditingTag(tag)
    tagForm.reset({
      name: tag.name,
      isAutoAudit: tag.isAutoAudit ? 'true' : 'false',
      auditStartTime: formatDateValue(tag.auditStartTime),
      auditEndTime: formatDateValue(tag.auditEndTime),
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
        auditStartTime: values.auditStartTime || null,
        auditEndTime: values.auditEndTime || null,
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
    <div className="space-y-6">
      {feedback && (
        <Card className="border-border bg-card/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge
              className={
                feedback.type === 'success'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : feedback.type === 'error'
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-secondary text-secondary-foreground border border-border'
              }
            >
              {feedback.type === 'success' ? '成功' : feedback.type === 'error' ? '失败' : '提示'}
            </Badge>
            <span className="text-sm text-muted-foreground">{feedback.message}</span>
          </div>
        </Card>
      )}
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="搜索标签名称..."
          className="pl-10 bg-card border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredTags.map(tag => (
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
        {filteredTags.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无标签，点击右上角添加
          </div>
        )}
      </div>

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
                onValueChange={(val) => tagForm.setValue('isAutoAudit', val as 'true' | 'false')}
                defaultValue={tagForm.getValues('isAutoAudit')}
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
                <Input type="datetime-local" {...tagForm.register('auditStartTime')} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">自动过审结束时间</label>
                <Input type="datetime-local" {...tagForm.register('auditEndTime')} className="bg-background border-border" />
              </div>
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
