'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Eye, ThumbsUp, Calendar, User, MapPin, Tag, Code, Award, ShieldCheck, Users, Phone, Mail, ExternalLink, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { CityFilter, FilterState } from '@/components/work/city-filter'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { useParams } from 'next/navigation'
import { Link } from '@/lib/language/navigation'
import { Button } from '@/components/ui/button'
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
import { EditForm } from '@/components/work/edit-form'
import { LoadingOverlay } from '@/components/common/loading-overlay'

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
  detail?: {
    story: string | null
    highlights: unknown
    scenarios: unknown
    demoUrl: string | null
    repoUrl: string | null
  } | null
  images?: {
    id: string
    imageUrl: string
    imageType: string | null
    sortOrder: number | null
  }[]
  team?: {
    members: unknown
    teamIntro: string | null
    contactPhone: string | null
    contactEmail: string | null
  } | null
}

interface DictItem {
  id: string
  itemLabel: string
  itemValue: string
  lang?: string
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
  teamMembers: z.string().optional().or(z.literal('')),
  teamIntro: z.string().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('请输入有效邮箱地址').optional().or(z.literal('')),
})

type WorkFormValues = z.infer<typeof workSchema>

interface WorksManagementProps {
  scope?: 'admin' | 'user'
  userId?: string
  allowedActions?: ('view' | 'edit' | 'audit' | 'tag' | 'honor' | 'delete')[]
}

export function WorksManagement({ 
  scope = 'admin', 
  userId, 
  allowedActions = ['view', 'edit', 'audit', 'tag', 'honor', 'delete'] 
}: WorksManagementProps) {
  const params = useParams()
  const lang = (params?.lang as string) || 'zh-CN'
  const router = useRouter()
  const locale = useLocale()
  
  const [isLoading, setIsLoading] = useState(false)
  const [works, setWorks] = useState<WorkItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    cities: [], categories: [], tags: [], countries: [], honors: [], auditStatuses: [],
  })
  const [selectedDate, setSelectedDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // Dictionaries
  const [countries, setCountries] = useState<DictItem[]>([])
  const [cities, setCities] = useState<DictItem[]>([])
  const [categories, setCategories] = useState<DictItem[]>([])
  const [devStatuses, setDevStatuses] = useState<DictItem[]>([])
  const [auditStatuses, setAuditStatuses] = useState<DictItem[]>([])
  const [availableTags, setAvailableTags] = useState<TagItem[]>([])
  const [availableHonors, setAvailableHonors] = useState<DictItem[]>([])

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null)
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null)
  
  // Delete Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [workToDelete, setWorkToDelete] = useState<WorkItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
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
  const [auditReason, setAuditReason] = useState('')
  const [isSavingAudit, setIsSavingAudit] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingWork, setViewingWork] = useState<WorkItem | null>(null)
  const [viewImageIndex, setViewImageIndex] = useState(0)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [previewTitle, setPreviewTitle] = useState('')

  const { feedback, showFeedback } = useFeedback()

  const normalizeStringList = (input: unknown): string[] => {
    if (!Array.isArray(input)) return []
    return input
      .map(item => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'value' in item) return String((item as { value?: unknown }).value ?? '').trim()
        return ''
      })
      .filter(Boolean)
  }

  // Fetch Dictionaries & Tags
  const fetchDicts = useCallback(async () => {
    try {
      const apiLang = lang

      const [resCountry, resCity, resCategory, resStatus, resTags, resHonors, resAudit] = await Promise.all([
        fetch(`/api/dictionaries?code=country&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=city&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=category_code&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=dev_status&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch('/api/tags?pageSize=100').then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=honor_type&lang=${apiLang}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/dictionaries?code=audit_status&lang=${apiLang}`).then(res => res.ok ? res.json() : null)
      ])

      if (resCountry?.items) setCountries(resCountry.items)
      if (resAudit?.items) setAuditStatuses(resAudit.items)
      if (resCity?.items) setCities(resCity.items)
      if (resCategory?.items) setCategories(resCategory.items)
      if (resStatus?.items) setDevStatuses(resStatus.items)
      if (resTags?.items) setAvailableTags(resTags.items)
      if (resHonors?.items) {
        setAvailableHonors(resHonors.items as DictItem[])
      }
    } catch (error) {
      console.error('Failed to fetch dictionaries:', error)
    }
  }, [lang])

  // Fetch Works
  const fetchWorks = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })
      
      if (userId) {
        params.append('userId', userId)
      }
      if (filters.categories.length) params.append('category', filters.categories[0])
      if (filters.countries.length) params.append('country', filters.countries[0])
      if (filters.honors.length) params.append('honor', filters.honors[0])
      if (filters.auditStatuses.length) params.append('auditStatus', filters.auditStatuses[0])
      if (selectedDate) params.append('date', selectedDate)

      const res = await fetch(`/api/console/works?${params.toString()}`)
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
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, showFeedback, userId, filters, selectedDate])

  // Initial fetch
  useEffect(() => {
    fetchWorks()
    fetchDicts()
  }, [fetchWorks, fetchDicts])

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, selectedDate])

  // Handlers
  const handleEdit = async (work: WorkItem) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/console/works?id=${work.id}`)
      if (res.ok) {
        const data = await res.json()
        setEditingWork(data)
        setIsDialogOpen(true)
      } else {
        showFeedback('error', '获取作品详情失败')
      }
    } catch (error) {
      showFeedback('error', '获取作品详情失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setIsDialogOpen(false)
    fetchWorks()
    showFeedback('success', '作品已更新')
  }

  const handleView = (work: WorkItem) => {
    setViewingWork(work)
    setViewImageIndex(0)
    setIsViewDialogOpen(true)
  }

  const openImagePreview = (images: string[], index: number, title: string) => {
    if (images.length === 0) return
    setPreviewImages(images)
    setPreviewImageIndex(index)
    setPreviewTitle(title)
    setIsImagePreviewOpen(true)
  }

  const handleOpenDeleteDialog = (work: WorkItem) => {
    setWorkToDelete(work)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!workToDelete) return
    
    try {
      setIsDeleting(true)
      setDeletingWorkId(workToDelete.id)
      const res = await fetch(`/api/console/works?id=${workToDelete.id}`, { method: 'DELETE' })
      
      if (res.ok) {
        setIsDeleteDialogOpen(false)
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
      setIsDeleting(false)
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
      const res = await fetch('/api/console/works', {
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
      const res = await fetch('/api/console/works', {
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
    setAuditReason('') // Reset reason
    setIsAuditDialogOpen(true)
  }

  const onSaveAudit = async () => {
    if (!selectedWork) return
    try {
      setIsSavingAudit(true)
      console.log('Saving audit status:', selectedAuditStatus, 'reason:', auditReason, 'for work:', selectedWork.id)
      
      const res = await fetch('/api/console/works', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWork.id,
          auditStatus: Number(selectedAuditStatus), // Ensure it's a number
          auditReason: auditReason // Send reason
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
  const viewingTeamMembers = normalizeStringList(viewingWork?.team?.members)
  const viewingHighlights = normalizeStringList(viewingWork?.detail?.highlights)
  const viewingScenarios = normalizeStringList(viewingWork?.detail?.scenarios)
  const viewingImages = (viewingWork?.images || []).filter(image => Boolean(image.imageUrl))
  const currentViewImageIndex = viewingImages.length > 0 ? Math.min(viewImageIndex, viewingImages.length - 1) : 0

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />
      
      {scope === 'admin' && (
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">作品管理</h2>
            <p className="text-muted-foreground mt-1">管理作品信息及状态</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="搜索作品名称、简介..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFilters({ cities: [], categories: [], tags: [], countries: [], honors: [], auditStatuses: [] }); setSelectedDate('') }}
            className="shrink-0"
          >
            重置筛选
          </Button>
        </div>

        {/* CityFilter — same as home page */}
        <CityFilter
          filters={filters}
          onFilterChange={setFilters}
          auditStatusOptions={auditStatuses.map(s => ({ label: s.itemLabel, value: s.itemValue }))}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

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
                      <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary cursor-pointer transition-colors" title={work.title} onClick={() => allowedActions.includes('view') && handleView(work)}>
                        {work.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1" title="作者">
                          <User size={14} />
                          <Link href={`/user/${work.userId}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">{work.user.username}</Link>
                        </div>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1" title="创建时间">
                          <Calendar size={14} />
                          <span>{new Date(work.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                        {work.statistic && (
                          <>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1" title="浏览量">
                              <Eye size={14} />
                              <span>{Number(work.statistic.viewCount) >= 1000 ? `${(Number(work.statistic.viewCount) / 1000).toFixed(1)}k` : work.statistic.viewCount}</span>
                            </div>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1" title="点赞数">
                              <ThumbsUp size={14} />
                              <span>{work.statistic.likeCount}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Jump to detail page */}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => router.push(`/${locale}/works/${work.id}`)} title="查看详情页">
                        <ExternalLink size={16} />
                      </Button>
                      {allowedActions.includes('view') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-indigo-500 hover:bg-indigo-500/10" onClick={() => handleView(work)} title="查看作品">
                          <Eye size={16} />
                        </Button>
                      )}
                      {allowedActions.includes('audit') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10" onClick={() => handleOpenAuditDialog(work)} title="审核作品">
                          <ShieldCheck size={16} />
                        </Button>
                      )}
                      {allowedActions.includes('edit') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(work)} title="编辑作品">
                          <Edit size={16} />
                        </Button>
                      )}
                      {allowedActions.includes('tag') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenTagDialog(work)} title="关联标签">
                          <Tag size={16} />
                        </Button>
                      )}
                      {allowedActions.includes('honor') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenHonorDialog(work)} title="授予荣誉">
                          <Award size={16} />
                        </Button>
                      )}
                      {allowedActions.includes('delete') && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDeleteDialog(work)}
                          disabled={deletingWorkId === work.id}
                          title="删除作品"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
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
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[800px] max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>编辑作品</DialogTitle>
          </DialogHeader>
          {editingWork && (
            <EditForm
              initialData={editingWork as any}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingWork?.title || '查看作品'}</DialogTitle>
            <DialogDescription>
              参考提交作品信息展示，包含详情与团队信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 rounded-md overflow-hidden border border-border bg-secondary/20 relative group">
                {viewingWork?.coverUrl ? (
                  <img
                    src={viewingWork.coverUrl}
                    alt={viewingWork.title}
                    className="w-full h-48 object-cover cursor-zoom-in"
                    onClick={() => openImagePreview([viewingWork.coverUrl!], 0, `${viewingWork.title} - 封面`)}
                    title="点击查看大图"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">无封面图</div>
                )}
                {viewingWork?.coverUrl ? (
                  <div className="absolute top-3 right-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-90">
                    点击查看大图
                  </div>
                ) : null}
              </div>
              <div className="md:col-span-2 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">一句话简介</div>
                  <div className="text-sm">{viewingWork?.summary || '暂无'}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">分类</div>
                    <div>{getLabel(viewingWork?.categoryCode || null, categories) || '暂无'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">开发状态</div>
                    <div>{getLabel(viewingWork?.devStatusCode || null, devStatuses) || '暂无'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">省份/城市</div>
                    <div>
                      {viewingWork?.countryCode ? getLabel(viewingWork.countryCode, countries) : ''}
                      {viewingWork?.countryCode && viewingWork?.cityCode ? ' · ' : ''}
                      {viewingWork?.cityCode ? getLabel(viewingWork.cityCode, cities) : ''}
                      {!viewingWork?.countryCode && !viewingWork?.cityCode ? '暂无' : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">作者</div>
                    <div>{viewingWork?.user?.username || '暂无'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">轮播图片</div>
              <div className="rounded-md border border-border p-3 bg-secondary/20">
                {viewingImages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-md bg-black/20 group">
                      <img
                        src={viewingImages[currentViewImageIndex].imageUrl}
                        alt={`${viewingWork?.title || '作品'}-轮播图-${currentViewImageIndex + 1}`}
                        className="w-full h-56 sm:h-72 object-cover cursor-zoom-in"
                        onClick={() => openImagePreview(viewingImages.map(image => image.imageUrl), currentViewImageIndex, `${viewingWork?.title || '作品'} - 项目截图`)}
                        title="点击查看大图"
                      />
                      <div className="absolute top-3 right-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white/90 backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-90">
                        点击查看大图
                      </div>
                      {viewingImages.length > 1 && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setViewImageIndex(prev => (prev - 1 + viewingImages.length) % viewingImages.length)}
                          >
                            <ChevronLeft size={16} />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setViewImageIndex(prev => (prev + 1) % viewingImages.length)}
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                    {viewingImages.length > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        {viewingImages.map((_, index) => (
                          <button
                            key={`view-image-dot-${index}`}
                            type="button"
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${index === currentViewImageIndex ? 'bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                            onClick={() => setViewImageIndex(index)}
                            aria-label={`切换到第 ${index + 1} 张图片`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">暂无关联轮播图片</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">详细内容</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-2">创作故事</div>
                  <div className="text-sm whitespace-pre-wrap">{viewingWork?.detail?.story || '暂无'}</div>
                </div>
                <div className="rounded-md border border-border p-3 space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">核心亮点</div>
                    {viewingHighlights.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingHighlights.map((item, idx) => (
                          <Badge key={`${item}-${idx}`} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm">暂无</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">使用场景</div>
                    {viewingScenarios.length > 0 ? (
                      <div className="space-y-1">
                        {viewingScenarios.map((item, idx) => (
                          <div key={`${item}-${idx}`} className="text-sm">• {item}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm">暂无</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">演示链接</div>
                  {viewingWork?.detail?.demoUrl ? (
                    <a href={viewingWork.detail.demoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
                      <ExternalLink size={14} />
                      {viewingWork.detail.demoUrl}
                    </a>
                  ) : <div className="text-sm">暂无</div>}
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">代码仓库</div>
                  {viewingWork?.detail?.repoUrl ? (
                    <a href={viewingWork.detail.repoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
                      <ExternalLink size={14} />
                      {viewingWork.detail.repoUrl}
                    </a>
                  ) : <div className="text-sm">暂无</div>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">团队信息</div>
              <div className="rounded-md border border-border p-3 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Users size={13} />团队成员</div>
                  {viewingTeamMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingTeamMembers.map((member, idx) => (
                        <Badge key={`${member}-${idx}`} variant="outline">{member}</Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm">暂无</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">团队介绍</div>
                  <div className="text-sm whitespace-pre-wrap">{viewingWork?.team?.teamIntro || '暂无'}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <Phone size={14} />
                    <span>{viewingWork?.team?.contactPhone || '暂无'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Mail size={14} />
                    <span>{viewingWork?.team?.contactEmail || '暂无'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
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

      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[1100px]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>
              {previewImages.length > 1 ? `${previewImageIndex + 1} / ${previewImages.length}` : '图片预览'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative rounded-md overflow-hidden border border-border bg-black/50">
              {previewImages[previewImageIndex] ? (
                <img
                  src={previewImages[previewImageIndex]}
                  alt={`${previewTitle}-${previewImageIndex + 1}`}
                  className="w-full max-h-[75vh] object-contain bg-black"
                />
              ) : null}
              {previewImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewImageIndex(prev => (prev - 1 + previewImages.length) % previewImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
                    aria-label="上一张"
                    title="上一张"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewImageIndex(prev => (prev + 1) % previewImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
                    aria-label="下一张"
                    title="下一张"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {previewImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {previewImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setPreviewImageIndex(index)}
                    className={`rounded-md overflow-hidden border ${index === previewImageIndex ? 'border-primary' : 'border-border'}`}
                    aria-label={`预览第 ${index + 1} 张图片`}
                    title={`预览第 ${index + 1} 张图片`}
                  >
                    <img src={image} alt={`${previewTitle}-${index + 1}`} className="w-full h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
            
            <div className="space-y-2">
              <Label>审核意见</Label>
              <Textarea 
                placeholder="请输入审核意见（选填）"
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>删除作品</DialogTitle>
            <DialogDescription>
              确定要删除作品「{workToDelete?.title}」吗？此操作不可恢复。
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
