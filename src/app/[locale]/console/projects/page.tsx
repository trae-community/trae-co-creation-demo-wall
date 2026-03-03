'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye, Calendar, User, MapPin, Tag, Code } from 'lucide-react'
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
}

interface DictItem {
  itemLabel: string
  itemValue: string
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

export default function ProjectsPage() {
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
  const [users, setUsers] = useState<{id: string, username: string}[]>([])
  const [availableTags, setAvailableTags] = useState<TagItem[]>([])

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
      const [resCountry, resCity, resCategory, resStatus, resUsers, resTags] = await Promise.all([
        fetch('/api/dictionaries?code=country').then(res => res.ok ? res.json() : null),
        fetch('/api/dictionaries?code=city').then(res => res.ok ? res.json() : null),
        fetch('/api/dictionaries?code=category').then(res => res.ok ? res.json() : null),
        fetch('/api/dictionaries?code=dev_status').then(res => res.ok ? res.json() : null),
        fetch('/api/users?pageSize=100').then(res => res.ok ? res.json() : null),
        fetch('/api/tags?pageSize=100').then(res => res.ok ? res.json() : null)
      ])

      if (resCountry?.items) setCountries(resCountry.items)
      if (resCity?.items) setCities(resCity.items)
      if (resCategory?.items) setCategories(resCategory.items)
      if (resStatus?.items) setDevStatuses(resStatus.items)
      if (resUsers?.items) setUsers(resUsers.items.map((u: any) => ({ id: u.id, username: u.username })))
      if (resTags?.items) setAvailableTags(resTags.items)
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
          <Card key={work.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
              <div className="h-24 w-24 rounded-lg bg-secondary shrink-0 overflow-hidden">
                {work.coverUrl ? (
                  <img src={work.coverUrl} alt={work.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    IMG
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{work.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User size={14} />
                      <span>{work.user.username}</span>
                      <span className="text-border">|</span>
                      <Calendar size={14} />
                      <span>{new Date(work.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(work)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenTagDialog(work)} title="关联标签">
                      <Tag size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-400"
                      onClick={() => handleDelete(work.id)}
                      disabled={deletingWorkId === work.id}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {work.devStatusCode && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      <Code size={12} className="mr-1" />
                      {getLabel(work.devStatusCode, devStatuses)}
                    </Badge>
                  )}
                  {work.categoryCode && (
                    <Badge variant="outline">
                      <Tag size={12} className="mr-1" />
                      {getLabel(work.categoryCode, categories)}
                    </Badge>
                  )}
                  {(work.countryCode || work.cityCode) && (
                    <Badge variant="secondary" className="text-muted-foreground">
                      <MapPin size={12} className="mr-1" />
                      {[getLabel(work.countryCode, countries), getLabel(work.cityCode, cities)].filter(Boolean).join(' · ')}
                    </Badge>
                  )}
                  {work.tags && work.tags.map(t => (
                    <Badge key={t.tag.id} variant="secondary" className="text-xs bg-secondary/50">
                      #{t.tag.name}
                    </Badge>
                  ))}
                </div>

                {work.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {work.summary}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {works.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
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
    </div>
  )
}
