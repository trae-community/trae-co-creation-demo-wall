'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  name: string
  href?: string
  icon?: any
  children?: NavItem[]
}

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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

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

  const navItems = useMemo(() => {
    const allNavItems: NavItem[] = [
      { name: '概览', href: '/console', icon: LayoutDashboard },
      { 
        name: '用户与权限', 
        icon: Users,
        children: [
          { name: '用户管理', href: '/console/users' },
          { name: '角色管理', href: '/console/roles' },
        ]
      },
      { 
        name: '内容管理',
        icon: FolderKanban,
        children: [
          { name: '作品管理', href: '/console/works' },
        ]
      },
      { 
        name: '系统配置',
        icon: BookOpen,
        children: [
          { name: '字典管理', href: '/console/dictionaries' },
          { name: '标签管理', href: '/console/tags' },
          { name: '城市管理', href: '/console/cities' },
        ]
      },
      { 
        name: '日志审计',
        icon: Logs,
        children: [
          { name: '登录注册日志', href: '/console/auth-logs' },
          { name: '操作日志', href: '/console/operation-logs' },
        ]
      },
    ]

    const isRoot = userRoles.some(role => role.id === 1)
    const isAdmin = userRoles.some(role => role.id === 2)
    const allowedItems = ['用户管理', '作品管理', '标签管理']

    const filterNavItems = (items: NavItem[]): NavItem[] => {
      if (isRoot) return items;
      if (!isAdmin) return []; // Only Root and Admin have access

      return items.reduce<NavItem[]>((acc, item) => {
        // Check if item itself is allowed (leaf node check by name)
        // Note: Parent nodes like '用户与权限' are not in allowedItems, but we keep them if they have valid children
        const isItemAllowed = item.name && allowedItems.includes(item.name);
        
        if (item.children) {
          const filteredChildren = filterNavItems(item.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        } else if (isItemAllowed) {
          acc.push(item);
        }
        return acc;
      }, []);
    }

    return filterNavItems(allNavItems);
  }, [userRoles])

  // Initialize expanded groups based on active route
  useEffect(() => {
    if (navItems.length > 0) {
      const groupsToExpand: string[] = []
      navItems.forEach(item => {
        if (item.children && item.children.some(child => child.href === pathname || (child.href && pathname.startsWith(child.href + '/')))) {
          groupsToExpand.push(item.name)
        }
      })
      if (groupsToExpand.length > 0) {
        setExpandedGroups(prev => [...new Set([...prev, ...groupsToExpand])])
      }
    }
  }, [pathname, navItems])

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => 
      prev.includes(name) 
        ? prev.filter(g => g !== name) 
        : [...prev, name]
    )
  }

  // Helper to flatten items for route checking
  const allowedHrefs = useMemo(() => {
    const getAllAllowedHrefs = (items: NavItem[]): string[] => {
      const hrefs: string[] = [];
      items.forEach(item => {
        if (item.href) hrefs.push(item.href);
        if (item.children) hrefs.push(...getAllAllowedHrefs(item.children));
      });
      return hrefs;
    }
    return getAllAllowedHrefs(navItems);
  }, [navItems])

  const isRoot = userRoles.some(role => role.id === 1)
  const isAdmin = userRoles.some(role => role.id === 2)
  const hasAccess = isRoot || isAdmin

  // Route protection
  useEffect(() => {
    if (isLoading) return
    
    if (!hasAccess) {
      router.push('/')
      return
    }

    const isAllowed = allowedHrefs.some(href => 
      pathname === href || pathname.startsWith(`${href}/`)
    )

    // Allow root path '/console' if it's in the allowed list (Overview)
    // Note: If Overview is filtered out for Admin, they should be redirected
    if (!isAllowed) {
      if (allowedHrefs.length > 0) {
        router.push(allowedHrefs[0])
      } else {
        router.push('/')
      }
    }
  }, [pathname, isLoading, hasAccess, allowedHrefs, router])

  if (isLoading) {
    return null
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (item.children) {
      const isExpanded = expandedGroups.includes(item.name)
      const isActiveGroup = item.children.some(child => child.href === pathname)
      
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleGroup(item.name)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-white/5 hover:text-foreground text-muted-foreground",
              isActiveGroup ? "text-foreground" : ""
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon size={20} className={cn("transition-colors", isActiveGroup ? "text-primary" : "group-hover:text-white")} />}
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDown size={16} className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
          </button>
          
          {isExpanded && (
            <div className="space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
              {item.children.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    const isActive = pathname === item.href
    return (
      <Link
        key={item.href}
        href={item.href || '#'}
        prefetch={false}
        onClick={() => setIsSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
          isActive 
            ? "bg-primary/10 text-primary border border-primary/20" 
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent",
          depth > 0 ? "pl-11" : "" // Indent children
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
        )}
        {/* Only show icon if depth is 0 (top level items like Overview), otherwise hide icon for children to keep it clean, or optional */}
        {depth === 0 && item.icon && <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />}
        <span className="font-medium">{item.name}</span>
      </Link>
    )
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

      {/* Sidebar */}
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
            {navItems.map(item => renderNavItem(item))}
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
