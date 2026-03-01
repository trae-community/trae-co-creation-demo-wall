'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Search, Globe, ChevronDown, ChevronRight } from 'lucide-react'
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
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

// Types
interface DictItem {
  id: string
  dictCode: string
  itemLabel: string
  itemValue: string
  lang?: string | null
  sortOrder: number
  status: boolean
}

interface Dict {
  id: string
  dictCode: string
  dictName: string
  description: string
  isSystem: boolean
  items: DictItem[]
}

// Schemas
const dictSchema = z.object({
  dictCode: z.string().min(1, '请输入字典编码'),
  dictName: z.string().min(1, '请输入字典名称'),
  description: z.string().optional(),
})

const itemSchema = z.object({
  itemLabel: z.string().min(1, '请输入显示标签'),
  itemValue: z.string().min(1, '请输入存储值'),
  lang: z.string().optional(),
  sortOrder: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return 0
    const num = Number(value)
    return Number.isNaN(num) ? 0 : num
  }, z.number()),
})

export default function DictionariesPage() {
  const [dicts, setDicts] = useState<Dict[]>([])
  const [expandedDicts, setExpandedDicts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Dialog states
  const [isDictDialogOpen, setIsDictDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingDict, setEditingDict] = useState<Dict | null>(null)
  const [editingItem, setEditingItem] = useState<DictItem | null>(null)
  const [currentDictCode, setCurrentDictCode] = useState<string>('')
  const [isSavingDict, setIsSavingDict] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [deletingDictId, setDeletingDictId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  // Forms
  const dictForm = useForm<z.infer<typeof dictSchema>>({
    resolver: zodResolver(dictSchema),
    defaultValues: {
      dictCode: '',
      dictName: '',
      description: '',
    }
  })

  type ItemFormInput = z.input<typeof itemSchema>
  type ItemFormOutput = z.output<typeof itemSchema>

  const itemForm = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemLabel: '',
      itemValue: '',
      lang: 'zh-CN',
      sortOrder: 0,
    }
  })

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setFeedback({ type, message })
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500)
  }

  const fetchDicts = async () => {
    try {
      const res = await fetch('/api/dictionaries')
      if (res.ok) {
        const data = await res.json()
        setDicts(data)
      } else {
        showFeedback('error', '字典加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch dicts:', error)
      showFeedback('error', '字典加载失败')
    }
  }

  useEffect(() => {
    fetchDicts()
  }, [])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  // Toggle dictionary expansion
  const toggleExpand = (dictCode: string) => {
    const newExpanded = new Set(expandedDicts)
    if (newExpanded.has(dictCode)) {
      newExpanded.delete(dictCode)
    } else {
      newExpanded.add(dictCode)
    }
    setExpandedDicts(newExpanded)
  }

  // Dictionary Operations
  const onDictSubmit = async (values: z.infer<typeof dictSchema>) => {
    try {
      setIsSavingDict(true)
      const url = '/api/dictionaries'
      const method = editingDict ? 'PUT' : 'POST'
      const body = {
        type: 'dict',
        id: editingDict?.id,
        data: values
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsDictDialogOpen(false)
        fetchDicts()
        dictForm.reset()
        setEditingDict(null)
        showFeedback('success', editingDict ? '字典已更新' : '字典已创建')
      } else {
        showFeedback('error', '字典保存失败')
      }
    } catch (error) {
      console.error('Failed to save dict:', error)
      showFeedback('error', '字典保存失败')
    } finally {
      setIsSavingDict(false)
    }
  }

  const handleDeleteDict = async (id: string) => {
    if (!confirm('确定要删除该字典吗？这将同时删除所有关联的字典项。')) return

    try {
      setDeletingDictId(id)
      const res = await fetch(`/api/dictionaries?type=dict&id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchDicts()
        showFeedback('success', '字典已删除')
      } else {
        showFeedback('error', '字典删除失败')
      }
    } catch (error) {
      console.error('Failed to delete dict:', error)
      showFeedback('error', '字典删除失败')
    } finally {
      setDeletingDictId(null)
    }
  }

  // Item Operations
  const onItemSubmit = async (values: ItemFormOutput) => {
    try {
      setIsSavingItem(true)
      const langValue = values.lang === '__empty__' ? '' : values.lang
      const url = '/api/dictionaries'
      const method = editingItem ? 'PUT' : 'POST'
      const body = {
        type: 'item',
        id: editingItem?.id,
        data: {
          itemLabel: values.itemLabel,
          itemValue: values.itemValue,
          ...(langValue !== undefined ? { lang: langValue } : {}),
          sortOrder: values.sortOrder,
          dictCode: currentDictCode,
          status: true
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsItemDialogOpen(false)
        fetchDicts()
        itemForm.reset()
        setEditingItem(null)
        showFeedback('success', editingItem ? '字典项已更新' : '字典项已添加')
      } else {
        showFeedback('error', '字典项保存失败')
      }
    } catch (error) {
      console.error('Failed to save item:', error)
      showFeedback('error', '字典项保存失败')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定要删除该字典项吗？')) return

    try {
      setDeletingItemId(id)
      const res = await fetch(`/api/dictionaries?type=item&id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchDicts()
        showFeedback('success', '字典项已删除')
      } else {
        showFeedback('error', '字典项删除失败')
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      showFeedback('error', '字典项删除失败')
    } finally {
      setDeletingItemId(null)
    }
  }

  const openCreateDictDialog = () => {
    setEditingDict(null)
    dictForm.reset({
      dictCode: '',
      dictName: '',
      description: ''
    })
    setIsDictDialogOpen(true)
  }

  const openEditDictDialog = (dict: Dict) => {
    setEditingDict(dict)
    dictForm.reset({
      dictCode: dict.dictCode,
      dictName: dict.dictName,
      description: dict.description || ''
    })
    setIsDictDialogOpen(true)
  }

  const openCreateItemDialog = (dictCode: string) => {
    setEditingItem(null)
    setCurrentDictCode(dictCode)
    itemForm.reset({
      itemLabel: '',
      itemValue: '',
      lang: 'zh-CN',
      sortOrder: 0
    })
    setIsItemDialogOpen(true)
  }

  const openEditItemDialog = (item: DictItem, dictCode: string) => {
    setEditingItem(item)
    setCurrentDictCode(dictCode)
    itemForm.reset({
      itemLabel: item.itemLabel,
      itemValue: item.itemValue,
      lang: item.lang ?? 'zh-CN',
      sortOrder: item.sortOrder
    })
    setIsItemDialogOpen(true)
  }

  // Filter dicts
  const filteredDicts = dicts.filter(dict => 
    dict.dictName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dict.dictCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h2 className="text-2xl font-bold tracking-tight">字典管理</h2>
          <p className="text-muted-foreground mt-1">管理系统的多语言字典和枚举值</p>
        </div>
        <Button onClick={openCreateDictDialog} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          新建字典
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="搜索字典名称、编码..." 
          className="pl-10 bg-card border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Dictionary List */}
      <div className="space-y-4">
        {filteredDicts.map((dict) => (
          <Card key={dict.id} className="overflow-hidden border-border bg-card/50">
            {/* Dict Header */}
            <div 
              className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => toggleExpand(dict.dictCode)}
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  {expandedDicts.has(dict.dictCode) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{dict.dictName}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                      {dict.dictCode}
                    </Badge>
                    {dict.isSystem && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        系统预设
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{dict.description || '暂无描述'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => openEditDictDialog(dict)}>
                  <Edit size={16} />
                </Button>
                {!dict.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-400"
                    onClick={() => handleDeleteDict(dict.id)}
                    disabled={deletingDictId === dict.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => openCreateItemDialog(dict.dictCode)}>
                  <Plus size={16} className="mr-1" />
                  添加值
                </Button>
              </div>
            </div>

            {/* Dict Items */}
            {expandedDicts.has(dict.dictCode) && (
              <div className="border-t border-border bg-black/20 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dict.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border group hover:border-primary/30 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.itemLabel}</span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex gap-1 items-center">
                            <Globe size={10} />
                            {item.lang}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded w-fit">
                          {item.itemValue}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItemDialog(item, dict.dictCode)}>
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-400"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingItemId === item.id}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dict.items.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                      暂无字典项，点击右上角添加
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Dict Dialog */}
      <Dialog open={isDictDialogOpen} onOpenChange={setIsDictDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingDict ? '编辑字典' : '新建字典'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={dictForm.handleSubmit(onDictSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">字典编码 (Unique)</label>
              <Input {...dictForm.register('dictCode')} disabled={!!editingDict} placeholder="例如: gender, country" className="bg-background border-border" />
              {dictForm.formState.errors.dictCode && <p className="text-red-500 text-xs">{dictForm.formState.errors.dictCode.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">字典名称</label>
              <Input {...dictForm.register('dictName')} placeholder="例如: 性别, 国家" className="bg-background border-border" />
              {dictForm.formState.errors.dictName && <p className="text-red-500 text-xs">{dictForm.formState.errors.dictName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input {...dictForm.register('description')} className="bg-background border-border" />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSavingDict}>
                {isSavingDict ? '处理中...' : editingDict ? '保存修改' : '立即创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑字典项' : '添加字典项'}</DialogTitle>
            <DialogDescription>
              所属字典: <span className="font-mono text-primary">{currentDictCode}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">存储值 (Value)</label>
                <Input {...itemForm.register('itemValue')} placeholder="例如: 1, CN" className="bg-background border-border" />
                {itemForm.formState.errors.itemValue && <p className="text-red-500 text-xs">{itemForm.formState.errors.itemValue.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">语言 (Lang)</label>
                <Select 
                  onValueChange={(val) => itemForm.setValue('lang', val)} 
                  defaultValue={itemForm.getValues('lang')}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="选择语言" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">中文 (zh-CN)</SelectItem>
                    <SelectItem value="en-US">English (en-US)</SelectItem>
                    <SelectItem value="ja-JP">日本語 (ja-JP)</SelectItem>
                    <SelectItem value="__empty__">留空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">显示标签 (Label)</label>
              <Input {...itemForm.register('itemLabel')} placeholder="例如: 男, Male" className="bg-background border-border" />
              {itemForm.formState.errors.itemLabel && <p className="text-red-500 text-xs">{itemForm.formState.errors.itemLabel.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">排序权重</label>
              <Input type="number" {...itemForm.register('sortOrder')} className="bg-background border-border" />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSavingItem}>
                {isSavingItem ? '处理中...' : editingItem ? '保存修改' : '立即添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
