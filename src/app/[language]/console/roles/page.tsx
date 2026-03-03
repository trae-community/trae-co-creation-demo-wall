'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { useFeedback } from '@/hooks/use-feedback'
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
import { LoadingOverlay } from '@/components/common/loading-overlay'

// Types
interface RoleItem {
  id: number
  roleCode: string
  roleName: string
  description: string | null
}

// Schema
const roleSchema = z.object({
  roleCode: z.string().min(1, '请输入角色编码'),
  roleName: z.string().min(1, '请输入角色名称'),
  description: z.string().optional().or(z.literal('')),
})

type RoleFormValues = z.infer<typeof roleSchema>

export default function RolesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)
  
  const { feedback, showFeedback } = useFeedback()

  // Form
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roleCode: '',
      roleName: '',
      description: '',
    }
  })

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })
      
      const res = await fetch(`/api/roles?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRoles(data.items || [])
        setTotalItems(data.total || 0)
      } else {
        showFeedback('error', '角色列表加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      showFeedback('error', '角色列表加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, showFeedback])

  // Initial fetch
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handlers
  const handleCreate = () => {
    setEditingRole(null)
    form.reset({
      roleCode: '',
      roleName: '',
      description: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (role: RoleItem) => {
    setEditingRole(role)
    form.reset({
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该角色吗？此操作不可恢复。')) return
    
    try {
      setDeletingRoleId(id)
      const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' })
      
      if (res.ok) {
        fetchRoles()
        showFeedback('success', '角色已删除')
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete role:', error)
      showFeedback('error', '删除失败')
    } finally {
      setDeletingRoleId(null)
    }
  }

  const onSubmit = async (values: RoleFormValues) => {
    try {
      setIsSaving(true)
      const url = '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'
      const body = editingRole ? { ...values, id: editingRole.id } : values

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchRoles()
        showFeedback('success', editingRole ? '角色已更新' : '角色已创建')
      } else {
        const data = await res.json()
        if (res.status === 409) {
          showFeedback('error', '角色编码已存在')
        } else {
          showFeedback('error', data.error || '保存失败')
        }
      }
    } catch (error) {
      console.error('Failed to save role:', error)
      showFeedback('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(currentPage, totalPages)
  const startIndex = (current - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">角色管理</h2>
          <p className="text-muted-foreground mt-1">管理系统角色权限</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>

      <CrudFilterBar
        searchPlaceholder="搜索角色名称或编码..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue="all"
        filterOptions={[]} 
        onFilterChange={() => {}}
        filterPlaceholder="筛选角色"
      />

      <div className="space-y-4">
        {roles.map(role => (
          <Card key={role.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{role.roleName}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                      {role.roleCode}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                  <Edit size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleDelete(role.id)}
                  disabled={deletingRoleId === role.id}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {roles.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无角色，点击右上角添加
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
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新建角色'}</DialogTitle>
            <DialogDescription>
              {editingRole ? '修改角色信息' : '创建新角色'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">角色名称 <span className="text-red-500">*</span></label>
              <Input {...form.register('roleName')} placeholder="例如：管理员" />
              {form.formState.errors.roleName && <p className="text-red-500 text-xs">{form.formState.errors.roleName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">角色编码 <span className="text-red-500">*</span></label>
              <Input {...form.register('roleCode')} placeholder="例如：admin" />
              {form.formState.errors.roleCode && <p className="text-red-500 text-xs">{form.formState.errors.roleCode.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Input {...form.register('description')} placeholder="角色职责描述..." />
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
    </div>
  )
}
