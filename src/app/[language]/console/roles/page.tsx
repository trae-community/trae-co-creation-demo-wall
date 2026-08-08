'use client'

import { useCallback, useEffect, useState } from 'react'
import { Shield, Info, Lock } from 'lucide-react'

import { CrudFeedback } from '@/components/crud/crud-feedback'
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { useFeedback } from '@/lib/use-feedback'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { Card } from '@/components/ui/card'
import { LoadingOverlay } from '@/components/common/loading-overlay'

// Types
interface RoleItem {
  id: number
  roleCode: string
  roleName: string
  description: string | null
}

// 内置角色的权限说明（与系统权限控制保持一致）
const BUILTIN_ROLE_INFO: Record<string, string[]> = {
  root: [
    '可访问全部控制台模块（概览、用户与权限、内容管理、系统配置、日志审计）',
    '可为用户分配角色',
  ],
  admin: [
    '可访问用户管理、作品管理、城市数据、标签管理、日志审计',
    '不可访问角色管理、字典管理',
  ],
  common: [
    '可浏览作品、点赞、评论、提交作品等前台功能',
    '不可访问控制台',
  ],
}

export default function RolesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  const { feedback, showFeedback } = useFeedback()

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
          <p className="text-muted-foreground mt-1">查看系统角色及其权限说明</p>
        </div>
      </div>

      {/* 系统角色说明横幅 */}
      <Card className="border-border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">系统内置角色说明</p>
            <p>系统固定为「根用户」「管理员」「普通用户」三个内置角色，不支持新增、修改或删除。如需调整权限范围，请联系开发人员。</p>
          </div>
        </div>
      </Card>

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-lg">{role.roleName}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                      {role.roleCode}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <Lock size={12} />
                      内置角色
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  )}
                  {/* 权限说明 */}
                  {BUILTIN_ROLE_INFO[role.roleCode] && (
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      {BUILTIN_ROLE_INFO[role.roleCode].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {roles.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
            暂无匹配的角色
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
    </div>
  )
}
