'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Link, usePathname, useRouter } from '@/lib/language/navigation'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Users,
  Logs,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  key: string
  nameKey: string
  href?: string
  icon?: React.ComponentType<{ size?: number | string; className?: string }>
  children?: NavItem[]
  /** Admin 角色可访问的叶子节点 key */
  adminLeaf?: boolean
}

const ADMIN_LEAF_KEYS = new Set(['users', 'works', 'posters', 'tags', 'cities'])

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const tNav = useTranslations('Console.nav')
  const tConsole = useTranslations('Console')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const { data: session, status } = useSession()
  const [roles, setRoles] = useState<string[]>([])
  const [rolesLoaded, setRolesLoaded] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setRolesLoaded(true)
      return
    }

    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const profileRoles: string[] = (data?.profile?.roles ?? []).map(
          (r: { roleCode: string }) => r.roleCode
        )
        setRoles(profileRoles)
      })
      .catch(() => {})
      .finally(() => setRolesLoaded(true))
  }, [status])

  const isRoot = roles.includes('root')
  const isAdmin = roles.includes('admin')
  const hasAccess = isRoot || isAdmin
  const isAuthenticated = status === 'authenticated'
  const rolesResolved = status !== 'loading' && rolesLoaded

  const navItems = useMemo(() => {
    const allNavItems: NavItem[] = [
      { key: 'overview', nameKey: 'overview', href: '/console', icon: LayoutDashboard },
      {
        key: 'users-permissions',
        nameKey: 'usersPermissions',
        icon: Users,
        children: [
          { key: 'users', nameKey: 'users', href: '/console/users', adminLeaf: true },
          { key: 'roles', nameKey: 'roles', href: '/console/roles' },
        ],
      },
      {
        key: 'content',
        nameKey: 'contentManagement',
        icon: FolderKanban,
        children: [
          { key: 'works', nameKey: 'works', href: '/console/works', adminLeaf: true },
          { key: 'posters', nameKey: 'posters', href: '/console/posters', adminLeaf: true },
          { key: 'code-blind-box', nameKey: 'codeBlindBox', href: '/console/code-blind-box' },
          { key: 'cities', nameKey: 'cities', href: '/console/cities', adminLeaf: true },
        ],
      },
      {
        key: 'system',
        nameKey: 'systemConfig',
        icon: BookOpen,
        children: [
          { key: 'dictionaries', nameKey: 'dictionaries', href: '/console/dictionaries' },
          { key: 'tags', nameKey: 'tags', href: '/console/tags', adminLeaf: true },
        ],
      },
      {
        key: 'audit',
        nameKey: 'logAudit',
        icon: Logs,
        children: [
          { key: 'auth-logs', nameKey: 'authLogs', href: '/console/auth-logs' },
          { key: 'operation-logs', nameKey: 'operationLogs', href: '/console/operation-logs' },
        ],
      },
    ]

    const filterNavItems = (items: NavItem[]): NavItem[] => {
      if (isRoot) return items
      if (!isAdmin) return []

      return items.reduce<NavItem[]>((acc, item) => {
        if (item.children) {
          const filteredChildren = filterNavItems(item.children)
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren })
          }
        } else if (item.href) {
          if (isRoot) {
            acc.push(item)
          } else if (item.adminLeaf && ADMIN_LEAF_KEYS.has(item.key)) {
            acc.push(item)
          }
        }
        return acc
      }, [])
    }

    return filterNavItems(allNavItems)
  }, [roles, isRoot, isAdmin])

  useEffect(() => {
    if (navItems.length > 0) {
      const groupsToExpand: string[] = []
      navItems.forEach(item => {
        if (
          item.children &&
          item.children.some(
            child =>
              child.href === pathname ||
              (child.href && pathname.startsWith(child.href + '/'))
          )
        ) {
          groupsToExpand.push(item.key)
        }
      })
      if (groupsToExpand.length > 0) {
        setExpandedGroups(prev => [...new Set([...prev, ...groupsToExpand])])
      }
    }
  }, [pathname, navItems])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
    )
  }

  const allowedHrefs = useMemo(() => {
    const getAllAllowedHrefs = (items: NavItem[]): string[] => {
      const hrefs: string[] = []
      items.forEach(item => {
        if (item.href) hrefs.push(item.href)
        if (item.children) hrefs.push(...getAllAllowedHrefs(item.children))
      })
      return hrefs
    }
    return getAllAllowedHrefs(navItems)
  }, [navItems])

  useEffect(() => {
    if (!rolesResolved) return

    if (!isAuthenticated) {
      router.push(`/${locale}/sign-in`)
      return
    }

    if (!hasAccess) {
      router.push(`/${locale}`)
      return
    }

    const isAllowed = allowedHrefs.some(
      href => pathname === href || pathname.startsWith(`${href}/`)
    )

    if (!isAllowed) {
      if (allowedHrefs.length > 0) {
        router.push(allowedHrefs[0])
      } else {
        router.push(`/${locale}`)
      }
    }
  }, [pathname, hasAccess, allowedHrefs, router, rolesResolved, isAuthenticated, locale])

  const renderNavItem = (item: NavItem, depth = 0) => {
    const label = tNav(item.nameKey as Parameters<typeof tNav>[0])

    if (item.children) {
      const isExpanded = expandedGroups.includes(item.key)
      const isActiveGroup = item.children.some(child => child.href === pathname)

      return (
        <div key={item.key} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleGroup(item.key)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-muted hover:text-foreground text-muted-foreground',
              isActiveGroup ? 'text-foreground' : ''
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <item.icon
                  size={20}
                  className={cn(
                    'transition-colors',
                    isActiveGroup ? 'text-primary' : 'group-hover:text-foreground'
                  )}
                />
              )}
              <span className="font-medium">{label}</span>
            </div>
            <ChevronDown
              size={16}
              className={cn('transition-transform duration-200', isExpanded ? 'rotate-180' : '')}
            />
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
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent',
          depth > 0 ? 'pl-11' : ''
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
        )}
        {depth === 0 && item.icon && (
          <item.icon
            size={20}
            className={cn(
              'transition-colors',
              isActive ? 'text-primary' : 'group-hover:text-foreground'
            )}
          />
        )}
        <span className="font-medium">{label}</span>
      </Link>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors border border-border bg-card"
        >
          <Menu size={20} />
          <span className="sr-only">{tConsole('menuTitle')}</span>
        </button>
        <div className="text-lg font-semibold">{tConsole('mobileTitle')}</div>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[60] w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:bg-transparent lg:border-r-0 lg:block',
          !isSidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
        <div className="h-full flex flex-col lg:h-auto lg:sticky lg:top-24 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:overflow-hidden lg:shadow-sm">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-xl lg:hidden">
            <span className="font-bold text-xl">{tConsole('menuTitle')}</span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="hidden lg:flex h-16 items-center px-6 border-b border-border bg-card/50">
            <span className="font-bold text-lg">{tConsole('menuTitle')}</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto lg:overflow-visible">
            {navItems.map(item => renderNavItem(item))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          role="presentation"
        />
      )}
    </div>
  )
}
