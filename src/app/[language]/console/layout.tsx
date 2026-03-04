'use client'

import React, { useState, useEffect } from 'react'
import { Link, usePathname, useRouter } from '@/lib/language/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  BookOpen, 
  Building2, 
  Tags,
  Users,
  Shield,
  Logs,
  ShieldCheck,
  Menu, 
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [userRoles, setUserRoles] = useState<{ id: number; roleCode: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data?.profile?.roles) {
          setUserRoles(data.profile.roles)
        }
      })
      .catch(err => console.error('Failed to fetch user roles:', err))
      .finally(() => setIsLoading(false))
  }, [])

  const allNavItems = [
    { name: '概览', href: '/console', icon: LayoutDashboard },
    { name: '用户管理', href: '/console/users', icon: Users },
    { name: '角色管理', href: '/console/roles', icon: Shield },
    { name: '作品管理', href: '/console/works', icon: FolderKanban },
    { name: '字典管理', href: '/console/dictionaries', icon: BookOpen },
    { name: '标签管理', href: '/console/tags', icon: Tags },
    { name: '城市管理', href: '/console/cities', icon: Building2 },
    { name: '登录注册日志', href: '/console/auth-logs', icon: ShieldCheck },
    { name: '操作日志', href: '/console/operation-logs', icon: Logs },
  ]

  // Filter nav items based on roles
  // Root user (role id = 1) has access to everything
  // Admin user (role id = 2) has limited access
  // Others have NO access
  const isRoot = userRoles.some(role => role.id === 1)
  const isAdmin = userRoles.some(role => role.id === 2)
  const hasAccess = isRoot || isAdmin

  const allowedItems = ['用户管理', '作品管理', '标签管理']
  
  const navItems = isRoot 
    ? allNavItems 
    : isAdmin 
      ? allNavItems.filter(item => allowedItems.includes(item.name))
      : []

  // Route protection
  useEffect(() => {
    if (isLoading) return
    
    // If no access (not role 1 or 2), redirect to home
    if (!hasAccess) {
      router.push('/')
      return
    }

    const isAllowed = navItems.some(item => 
      pathname === item.href || pathname.startsWith(`${item.href}/`)
    )

    if (!isAllowed) {
      if (navItems.length > 0) {
        router.push(navItems[0].href)
      } else {
        router.push('/')
      }
    }
  }, [pathname, isLoading, hasAccess, navItems, router])

  if (isLoading) {
    return null // or a loading spinner
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors border border-border bg-card"
        >
          <Menu size={20} />
          <span className="sr-only">打开菜单</span>
        </button>
        <div className="text-lg font-semibold">控制台</div>
      </div>

      {/* Sidebar - Desktop (Sticky) & Mobile (Fixed Overlay) */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-[60] w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:bg-transparent lg:border-r-0 lg:block",
          !isSidebarOpen ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="h-full flex flex-col lg:h-auto lg:sticky lg:top-24 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:overflow-hidden lg:shadow-sm">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-xl lg:hidden">
            <span className="font-bold text-xl">控制台菜单</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="hidden lg:flex h-16 items-center px-6 border-b border-border bg-card/50">
             <span className="font-bold text-lg">控制台菜单</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto lg:overflow-visible">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
