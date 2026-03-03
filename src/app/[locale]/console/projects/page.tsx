'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye, Calendar, User, MapPin, Tag, Code, Award, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CrudFeedback } from '@/components/CrudFeedback'
import { CrudFilterBar } from '@/components/CrudFilterBar'
import { CrudPagination } from '@/components/CrudPagination'
import { useFeedback } from '@/components/useFeedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types
interface TagItem {
  id: number
  name: string
}

interface WorkItem {
  id: string
  userId: string
  title: string
  summary: string | null
  coverUrl: string | null
  countryCode: string | null
  cityCode: string | null
  categoryCode: string | null
  devStatusCode: string | null
  createdAt: string
  updatedAt: string
  user: {
    username: string
    email: string
    avatarUrl: string | null
  }
  tags: { tag: TagItem }[]
  honors: { 
    id: string
    honorItemId: string
    dictItem: DictItem 
  }[]
  statistic?: {
    auditStatus: number
    displayStatus: number
    viewCount: string
    likeCount: string
  }
}

interface DictItem {
  id: string
  itemLabel: string
  itemValue: string
  labelI18n?: Record<string, string> | null
}

// Schema
const workSchema = z.object({
  title: z.string().min(1, '请输入作品名称'),
  summary: z.string().optional().or(z.literal('')),
  coverUrl: z.string().optional().or(z.literal('')),
  countryCode: z.string().optional().or(z.literal('')),
  cityCode: z.string().optional().or(z.literal('')),
  categoryCode: z.string().optional().or(z.literal('')),
  devStatusCode: z.string().optional().or(z.literal('')),
  userId: z.string().min(1, '请选择所属用户'),
})

type WorkFormValues = z.infer<typeof workSchema>

import { useParams } from 'next/navigation'

export default function ProjectsPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'zh-CN' // Get locale from URL params
  
  const [works, setWorks] = useState<WorkItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // Dictionaries
  const [countries, setCountries] = useState<DictItem[]>([])
  const [cities, setCities] = useState<DictItem[]>([])
  const [categories, setCategories] = useState<DictItem[]>([])
  const [devStatuses, setDevStatuses] = useState<DictItem[]>([])
  const [auditStatuses, setAuditStatuses] = useState<DictItem[]>([])
  const [users, setUsers] = useState<{ id: string; username: string }[]>([])
  const [availableTags, setAvailableTags] = useState<TagItem[]>([])
  const [availableHonors, setAvailableHonors] = useState<DictItem[]>([])

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null)
  
  // Tag Dialog states
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [isSavingTags, setIsSavingTags] = useState(false)

  // Honor Dialog states
  const [isHonorDialogOpen, setIsHonorDialogOpen] = useState(false)
  const [selectedHonorIds, setSelectedHonorIds] = useState<string[]>([])
  const [isSavingHonors, setIsSavingHonors] = useState(false)

  // Audit Dialog states
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false)
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('0')
  const [isSavingAudit, setIsSavingAudit] = useState(false)

  const { feedback, showFeedback } = useFeedback()

  // Form
  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      title: '',
      summary: '',
      coverUrl: '',
      countryCode: '',
      cityCode: '',
      categoryCode: '',
      devStatusCode: '',
      userId: '',
    }
  })

  // Fetch Dictionaries & Tags
  const fetchDicts = useCallback(async () => {
    try {
      // Locale is now directly matched (zh-CN, en-US)
      const apiLang = locale

      const [resCountry, resCity, resCategory, resStatus, resUsers, resTags, resHonors, resAudit] = await Promise.all([
        fetch(`/api/dictionaries?code=country&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=city&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=category_code&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=dev_status&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch('/api/users?pageSize=100').then(res => res.ok ? res.json() : null),
        fetch('/api/tags?pageSize=100').then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=honor_type&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=audit_status&lang=${apiLang}`).then(res => res.ok ? res.json() : null)
      ])

      if (resCountry?.items) setCountries(resCountry.items)
      if (resAudit?.items) setAuditStatuses(resAudit.items)
      if (resCity?.items) setCities(resCity.items)
      if (resCategory?.items) setCategories(resCategory.items)
      if (resStatus?.items) setDevStatuses(resStatus.items)
      if (resUsers?.items) setUsers(resUsers.items.map((u: any) => ({ id: u.id, username: u.username })))
      if (resTags?.items) setAvailableTags(resTags.items)
      if (resHonors?.items) {
        setAvailableHonors(resHonors.items as DictItem[])
      }
    } catch (error) {
      console.error('Failed to fetch dictionaries:', error)
    }
  }, [])

  // Fetch Works
  const fetchWorks = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })
      
      const res = await fetch(`/api/projects?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setWorks(data.items || [])
        setTotalItems(data.total || 0)
      } else {
        showFeedback('error', '作品列表加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch works:', error)
      showFeedback('error', '作品列表加载失败')
    }
  }, [currentPage, pageSize, searchTerm, showFeedback])

  // Initial fetch
  useEffect(() => {
    fetchWorks()
    fetchDicts()
  }, [fetchWorks, fetchDicts])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handlers
  const handleEdit = (work: WorkItem) => {
    setEditingWork(work)
    form.reset({
      title: work.title,
      summary: work.summary || '',
      coverUrl: work.coverUrl || '',
      countryCode: work.countryCode || '',
      cityCode: work.cityCode || '',
      categoryCode: work.categoryCode || '',
      devStatusCode: work.devStatusCode || '',
      userId: work.userId,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该作品吗？此操作不可恢复。')) return
    
    try {
      setDeletingWorkId(id)
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      
      if (res.ok) {
        fetchWorks()
        showFeedback('success', '作品已删除')
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete work:', error)
      showFeedback('error', '删除失败')
    } finally {
      setDeletingWorkId(null)
    }
  }

  const handleOpenTagDialog = (work: WorkItem) => {
    setSelectedWork(work)
    setSelectedTagIds(work.tags ? work.tags.map(t => t.tag.id) : [])
    setIsTagDialogOpen(true)
  }

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const onSaveTags = async () => {
    if (!selectedWork) return
    try {
      setIsSavingTags(true)
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWork.id,
          tagIds: selectedTagIds
        })
      })

      if (res.ok) {
        setIsTagDialogOpen(false)
        fetchWorks()
        showFeedback('success', '作品标签已更新')
      } else {
        showFeedback('error', '更新标签失败')
      }
    } catch (error) {
      console.error('Failed to save tags:', error)
      showFeedback('error', '更新标签失败')
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleOpenHonorDialog = (work: WorkItem) => {
    setSelectedWork(work)
    // Find matching honor IDs from availableHonors
    // Now we can directly use the stored honorItemId
    const currentHonorIds = work.honors.map(h => h.honorItemId)
    
    // Remove duplicates
    setSelectedHonorIds([...new Set(currentHonorIds)])
    setIsHonorDialogOpen(true)
  }

  const handleHonorToggle = (honorId: string) => {
    setSelectedHonorIds(prev => 
      prev.includes(honorId)
        ? prev.filter(id => id !== honorId)
        : [...prev, honorId]
    )
  }

  const onSaveHonors = async () => {
    if (!selectedWork) return
    try {
      setIsSavingHonors(true)
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWork.id,
          honorIds: selectedHonorIds
        })
      })

      if (res.ok) {
        setIsHonorDialogOpen(false)
        fetchWorks()
        showFeedback('success', '作品荣誉已更新')
      } else {
        showFeedback('error', '更新荣誉失败')
      }
    } catch (error) {
      console.error('Failed to save honors:', error)
      showFeedback('error', '更新荣誉失败')
    } finally {
      setIsSavingHonors(false)
    }
  }

  const handleOpenAuditDialog = (work: WorkItem) => {
    setSelectedWork(work)
    // Ensure we are getting the correct initial value from work statistic
    // work.auditStatus might be directly on work object or inside statistic
    const status = work.statistic?.auditStatus !== undefined 
      ? String(work.statistic.auditStatus) 
      : '0'
    setSelectedAuditStatus(status)
    setIsAuditDialogOpen(true)
  }

  const onSaveAudit = async () => {
    if (!selectedWork) return
    try {
      setIsSavingAudit(true)
      console.log('Saving audit status:', selectedAuditStatus, 'for work:', selectedWork.id)
      
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWork.id,
          auditStatus: Number(selectedAuditStatus) // Ensure it's a number
        })
      })

      if (res.ok) {
        setIsAuditDialogOpen(false)
        await fetchWorks() // Wait for refresh
        showFeedback('success', '作品审核状态已更新')
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Audit update failed:', errorData)
        showFeedback('error', errorData.error || '更新审核状态失败')
      }
    } catch (error) {
      console.error('Failed to save audit status:', error)
      showFeedback('error', '更新审核状态失败')
    } finally {
      setIsSavingAudit(false)
    }
  }

  const onSubmit = async (values: WorkFormValues) => {
    try {
      setIsSaving(true)
      const url = '/api/projects'
      // Only Update allowed
      const method = 'PUT'
      const body = { ...values, id: editingWork?.id }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchWorks()
        showFeedback('success', '作品已更新')
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '保存失败')
      }
    } catch (error) {
      console.error('Failed to save work:', error)
      showFeedback('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // Helpers to get labels
  const getLabel = (value: string | null, list: DictItem[]) => {
    if (!value) return null
    return list.find(item => item.itemValue === value)?.itemLabel || value
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return (
    <div className="space-y-6">
      <CrudFeedback feedback={feedback} />
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">作品管理</h2>
          <p className="text-muted-foreground mt-1">管理作品信息及状态</p>
        </div>
      </div>

      <CrudFilterBar
        searchPlaceholder="搜索作品名称、简介..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue="all"
        filterOptions={[]} 
        onFilterChange={() => {}}
        filterPlaceholder="筛选作品"
      />

      <div className="space-y-4">
        {works.map(work => (
          <Card key={work.id} className="overflow-hidden border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex flex-col sm:flex-row">
              {/* Cover Image */}
              <div className="w-full sm:w-48 h-32 sm:h-auto bg-muted shrink-0 relative group">
                {work.coverUrl ? (
                  <img 
                    src={work.coverUrl} 
                    alt={work.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold opacity-20">NO</div>
                      <div className="text-sm opacity-40">IMAGE</div>
                    </div>
                  </div>
                )}
                {/* Status Badge Overlay */}
                <div className="absolute top-2 left-2 z-10">
                   {work.statistic && (
                     <Badge 
                      variant={work.statistic.auditStatus === 1 ? 'default' : work.statistic.auditStatus === 2 ? 'destructive' : 'secondary'} 
                      className="shadow-sm"
                    >
                       {auditStatuses.find(s => s.itemValue === work.statistic?.auditStatus?.toString())?.itemLabel || '待审核'}
                     </Badge>
                   )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary cursor-pointer transition-colors" title={work.title} onClick={() => handleEdit(work)}>
                        {work.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1" title="作者">
                          <User size={14} />
                          <span>{work.user.username}</span>
                        </div>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1" title="创建时间">
                          <Calendar size={14} />
                          <span>{new Date(work.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10" onClick={() => handleOpenAuditDialog(work)} title="审核作品">
                        <ShieldCheck size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(work)} title="编辑作品">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenTagDialog(work)} title="关联标签">
                        <Tag size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenHonorDialog(work)} title="授予荣誉">
                        <Award size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(work.id)}
                        disabled={deletingWorkId === work.id}
                        title="删除作品"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {work.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2" title={work.summary}>
                      {work.summary}
                    </p>
                  )}
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                  {/* Development Status */}
                  {work.devStatusCode && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      <Code size={12} className="mr-1" />
                      {getLabel(work.devStatusCode, devStatuses)}
                    </Badge>
                  )}
                  
                  {/* Category */}
                  {work.categoryCode && (
                    <Badge variant="outline">
                      <Tag size={12} className="mr-1" />
                      {getLabel(work.categoryCode, categories)}
                    </Badge>
                  )}

                  {/* Location */}
                  {(work.countryCode || work.cityCode) && (
                    <Badge variant="secondary" className="text-muted-foreground">
                      <MapPin size={12} className="mr-1" />
                      {work.countryCode ? getLabel(work.countryCode, countries) : ''}
                      {work.countryCode && work.cityCode ? ' · ' : ''}
                      {work.cityCode ? getLabel(work.cityCode, cities) : ''}
                    </Badge>
                  )}

                  {/* Tags */}
                  {work.tags && work.tags.map(t => (
                    <Badge key={t.tag.id} variant="secondary" className="text-xs bg-secondary/50">
                      #{t.tag.name}
                    </Badge>
                  ))}

                  {/* Honors */}
                  {work.honors && work.honors.map(h => (
                    <Badge key={h.id} variant="outline" className="text-xs border-yellow-500 text-yellow-500 bg-yellow-500/10">
                      <Award size={10} className="mr-1" />
                      {h.dictItem?.itemLabel || '未知荣誉'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {works.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg bg-card/30">
            暂无作品
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
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingWork ? '编辑作品' : '新建作品'}</DialogTitle>
            <DialogDescription>
              {editingWork ? '修改作品信息' : '创建新作品'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">作品名称 <span className="text-red-500">*</span></label>
              <Input {...form.register('title')} placeholder="请输入作品名称" />
              {form.formState.errors.title && <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">所属用户</label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  {users.find(u => u.id === form.getValues('userId'))?.username || '未知用户'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">开发状态</label>
                <Select onValueChange={(val) => form.setValue('devStatusCode', val)} defaultValue={form.getValues('devStatusCode')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {devStatuses.map(item => (
                      <SelectItem key={item.itemValue} value={item.itemValue}>{item.itemLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">国家</label>
                <Select onValueChange={(val) => form.setValue('countryCode', val)} defaultValue={form.getValues('countryCode')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择国家" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(item => (
                      <SelectItem key={item.itemValue} value={item.itemValue}>{item.itemLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">城市</label>
                <Select onValueChange={(val) => form.setValue('cityCode', val)} defaultValue={form.getValues('cityCode')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择城市" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(item => (
                      <SelectItem key={item.itemValue} value={item.itemValue}>{item.itemLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">类别</label>
                <Select onValueChange={(val) => form.setValue('categoryCode', val)} defaultValue={form.getValues('categoryCode')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(item => (
                      <SelectItem key={item.itemValue} value={item.itemValue}>{item.itemLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">封面图 URL</label>
              <Input {...form.register('coverUrl')} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">简介</label>
              <Textarea {...form.register('summary')} placeholder="作品一句话简介..." />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>关联标签</DialogTitle>
            <DialogDescription>
              为作品 "{selectedWork?.title}" 选择关联标签
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">暂无可用标签，请先在标签管理中添加</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {availableTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag.id}`} 
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>取消</Button>
            <Button onClick={onSaveTags} disabled={isSavingTags}>
              {isSavingTags ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHonorDialogOpen} onOpenChange={setIsHonorDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>授予荣誉</DialogTitle>
            <DialogDescription>
              为作品 "{selectedWork?.title}" 授予官方荣誉
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availableHonors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">暂无可用荣誉类型</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableHonors.map(honor => (
                  <div key={honor.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`honor-${honor.id}`} 
                      checked={selectedHonorIds.includes(honor.id)}
                      onCheckedChange={() => handleHonorToggle(honor.id)}
                    />
                    <Label htmlFor={`honor-${honor.id}`} className="cursor-pointer">
                      {honor.itemLabel}
                      {honor.lang && <span className="text-xs text-muted-foreground ml-1">({honor.lang})</span>}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHonorDialogOpen(false)}>取消</Button>
            <Button onClick={onSaveHonors} disabled={isSavingHonors}>
              {isSavingHonors ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>审核作品</DialogTitle>
            <DialogDescription>
              更改作品的审核状态。审核通过后作品将自动上架。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>审核状态</Label>
              <Select value={selectedAuditStatus} onValueChange={setSelectedAuditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择审核状态" />
                </SelectTrigger>
                <SelectContent>
                  {auditStatuses.map(status => (
                    <SelectItem key={status.id} value={status.itemValue}>{status.itemLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAuditDialogOpen(false)}>取消</Button>
            <Button onClick={onSaveAudit} disabled={isSavingAudit}>
              {isSavingAudit ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
