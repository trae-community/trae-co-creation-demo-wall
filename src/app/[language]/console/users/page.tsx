'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, User, Mail, Phone, Calendar, Shield, Filter, Ban, CircleCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { useFeedback } from '@/lib/use-feedback'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { Link } from '@/lib/language/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
interface Role {
  id: number
  roleName: string
  roleCode: string
  description?: string | null
}

interface UserItem {
  id: string
  username: string
  email: string
  phone: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
  roles: { role: Role }[]
  banned: boolean
}

// Schema
const userSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  email: z.string().email('请输入有效的邮箱地址'),
  phone: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')),
})

type UserFormValues = z.infer<typeof userSchema>

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<UserItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Role Dialog states
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [isSavingRoles, setIsSavingRoles] = useState(false)

  // Filter states
  const [filterRoleCode, setFilterRoleCode] = useState('all')

  // Ban Dialog states
  const [banTargetUser, setBanTargetUser] = useState<UserItem | null>(null)
  const [isBanning, setIsBanning] = useState(false)

  const { feedback, showFeedback } = useFeedback()

  // Form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      bio: '',
      avatarUrl: '',
    }
  })

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        [CRUD_QUERY_PARAMS.page]: String(currentPage),
        [CRUD_QUERY_PARAMS.pageSize]: String(pageSize),
        [CRUD_QUERY_PARAMS.query]: searchTerm,
      })

      // 添加角色筛选参数
      if (filterRoleCode && filterRoleCode !== 'all') {
        params.set('roleCode', filterRoleCode)
      }

      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.items || [])
        setTotalItems(data.total || 0)
      } else {
        showFeedback('error', '用户列表加载失败')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      showFeedback('error', '用户列表加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, filterRoleCode, showFeedback])

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles')
      if (res.ok) {
        const data = await res.json()
        setAvailableRoles(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRoleCode])

  // Handlers
  const handleCreate = () => {
    form.reset({
      username: '',
      email: '',
      phone: '',
      bio: '',
      avatarUrl: '',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: UserFormValues) => {
    try {
      setIsSaving(true)
      const url = '/api/users'
      // Only POST allowed
      const method = 'POST'
      const body = values

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchUsers()
        showFeedback('success', '用户已创建')
      } else {
        const data = await res.json()
        // Check for specific error codes if needed, e.g. duplicate email
        if (res.status === 409) {
          showFeedback('error', '用户名或邮箱已存在')
        } else {
          showFeedback('error', data.error || '保存失败')
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      showFeedback('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenRoleDialog = (user: UserItem) => {
    setSelectedUser(user)
    setSelectedRoleIds(user.roles ? user.roles.map(r => r.role.id) : [])
    setIsRoleDialogOpen(true)
  }

  const handleRoleToggle = useCallback((roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }, [])

  const onSaveRoles = async () => {
    if (!selectedUser) return
    try {
      setIsSavingRoles(true)
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          roleIds: selectedRoleIds
        })
      })

      if (res.ok) {
        setIsRoleDialogOpen(false)
        fetchUsers()
        showFeedback('success', '用户角色已更新')
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '更新角色失败')
      }
    } catch (error) {
      console.error('Failed to save roles:', error)
      showFeedback('error', '更新角色失败')
    } finally {
      setIsSavingRoles(false)
    }
  }

  // 打开封禁 / 解封确认弹窗
  const handleToggleBan = (user: UserItem) => {
    setBanTargetUser(user)
  }

  // 确认封禁 / 解封用户
  const confirmToggleBan = async () => {
    if (!banTargetUser) return
    try {
      setIsBanning(true)
      const res = await fetch(`/api/users/${banTargetUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !banTargetUser.banned })
      })
      if (res.ok) {
        showFeedback('success', banTargetUser.banned ? '用户已解封' : '用户已封禁')
        setBanTargetUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        showFeedback('error', data.error || '操作失败')
      }
    } catch (error) {
      console.error('Failed to ban/unban user:', error)
      showFeedback('error', '操作失败')
    } finally {
      setIsBanning(false)
    }
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
          <h2 className="text-2xl font-bold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground mt-1">管理系统用户及基本信息</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          新建用户
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-md w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索用户名、邮箱或手机号..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={filterRoleCode} onValueChange={(value) => setFilterRoleCode(value)}>
              <SelectTrigger className="w-[200px] bg-secondary border-border">
                <SelectValue placeholder="全部角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.roleCode}>
                    {role.roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || filterRoleCode !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilterRoleCode('all')
              }}
              className="shrink-0"
            >
              重置筛选
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {users.map(user => (
          <Card key={user.id} className="overflow-hidden border-border bg-card/50">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <Link href={`/user/${user.id}`} className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/40 transition-all">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </Link>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/user/${user.id}`} className="font-semibold text-lg hover:text-primary transition-colors">{user.username}</Link>
                    {user.banned && (
                      <Badge variant="destructive" className="text-xs">已封禁</Badge>
                    )}
                    {user.roles && user.roles.map(r => (
                      <Badge key={r.role.id} variant="secondary" className="text-xs">
                        {r.role.roleName}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(user.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="ghost" size="sm" onClick={() => handleOpenRoleDialog(user)} title="分配角色">
                  <Shield size={16} />
                </Button>
                {user.banned ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleBan(user)}
                    title="解封用户"
                    className="hover:text-green-500 hover:bg-green-500/10"
                  >
                    <CircleCheck size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleBan(user)}
                    title="封禁用户"
                    className="hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Ban size={16} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {users.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无用户，点击右上角添加
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>
              创建新用户
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">用户名 <span className="text-red-500">*</span></label>
                <Input {...form.register('username')} placeholder="例如：john_doe" />
                {form.formState.errors.username && <p className="text-red-500 text-xs">{form.formState.errors.username.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱 <span className="text-red-500">*</span></label>
                <Input {...form.register('email')} placeholder="例如：john@example.com" />
                {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input {...form.register('phone')} placeholder="可选" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">头像 URL</label>
                <Input {...form.register('avatarUrl')} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">个人简介</label>
              <Input {...form.register('bio')} placeholder="简短介绍..." />
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
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>分配角色</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.username} 分配系统角色
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availableRoles.filter(role => role.roleCode !== 'root').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">暂无可用角色</p>
            ) : (
              availableRoles.filter(role => role.roleCode !== 'root').map(role => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`role-${role.id}`} 
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <Label htmlFor={`role-${role.id}`} className="flex flex-col">
                    <span>{role.roleName}</span>
                    <span className="text-xs text-muted-foreground font-normal">{role.description || role.roleCode}</span>
                  </Label>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>取消</Button>
            <Button onClick={onSaveRoles} disabled={isSavingRoles}>
              {isSavingRoles ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!banTargetUser} onOpenChange={(open) => !open && setBanTargetUser(null)}>
        <DialogContent className="bg-card border border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{banTargetUser?.banned ? '解封用户' : '封禁用户'}</DialogTitle>
            <DialogDescription>
              {banTargetUser?.banned
                ? `确定要解封用户「${banTargetUser?.username}」吗？解封后该用户可正常登录。`
                : `确定要封禁用户「${banTargetUser?.username}」吗？封禁后该用户将无法登录，已登录的会话也会失效。`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTargetUser(null)} disabled={isBanning}>取消</Button>
            {banTargetUser?.banned ? (
              <Button onClick={confirmToggleBan} disabled={isBanning}>
                {isBanning ? '解封中...' : '确认解封'}
              </Button>
            ) : (
              <Button variant="destructive" onClick={confirmToggleBan} disabled={isBanning}>
                {isBanning ? '封禁中...' : '确认封禁'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
