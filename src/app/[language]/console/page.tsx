'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, FileText, UserPlus, TrendingUp, Activity, PieChart, BarChart, Upload, Info } from 'lucide-react'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { CrudFeedback } from '@/components/crud/crud-feedback'
import { useFeedback } from '@/lib/use-feedback'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OverviewWindow = 7 | 30

interface StatItem {
  label: string
  value: number
  change: number
  tip?: string
}

interface TrendItem {
  date: string
  label: string
  visits: number
  registrations: number
  uploads: number
}

interface DistributionItem {
  label: string
  value: number
  tip?: string
}

interface ActivityItem {
  id: string
  type: 'register' | 'upload' | string
  title: string
  description: string
  status: string
  user: string
  createdAt: string
}

interface OverviewData {
  stats: {
    totalWorks: StatItem
    activeUsers: StatItem
    registeredUsers: StatItem
    systemVisits: StatItem
  }
  trend: TrendItem[]
  distribution: DistributionItem[]
  latestActivities: ActivityItem[]
}

const defaultData: OverviewData = {
  stats: {
    totalWorks: { label: '本周新增作品', value: 0, change: 0, tip: '' },
    activeUsers: { label: '本周登录用户', value: 0, change: 0, tip: '' },
    registeredUsers: { label: '本周新注册用户', value: 0, change: 0, tip: '' },
    systemVisits: { label: '本周认证事件', value: 0, change: 0, tip: '' }
  },
  trend: [],
  distribution: [],
  latestActivities: []
}

const formatNumber = (value: number) => value.toLocaleString('zh-CN')

const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value}%`

const cardMeta = [
  { key: 'totalWorks', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'activeUsers', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'registeredUsers', icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'systemVisits', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
] as const

export default function ConsolePage() {
  const [windowDays, setWindowDays] = useState<OverviewWindow>(7)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OverviewData>(defaultData)
  const { feedback, showFeedback } = useFeedback()

  const fetchOverview = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/console/overview?window=${windowDays}`)
      if (!response.ok) {
        showFeedback('error', '概览数据加载失败')
        return
      }
      const payload = await response.json()
      setData(payload)
    } catch (error) {
      console.error('Failed to fetch console overview:', error)
      showFeedback('error', '概览数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [windowDays, showFeedback])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const maxTrendValue = useMemo(() => {
    return Math.max(
      ...data.trend.map((item) => Math.max(item.visits, item.registrations, item.uploads)),
      1
    )
  }, [data.trend])

  const maxDistributionValue = useMemo(() => {
    return Math.max(...data.distribution.map((item) => item.value), 1)
  }, [data.distribution])

  const statEntries = useMemo(() => {
    return cardMeta.map((meta) => {
      const stat = data.stats[meta.key]
      return {
        ...meta,
        ...stat
      }
    })
  }, [data.stats])

  return (
    <div className="space-y-6 relative min-h-[500px]">
      <LoadingOverlay isLoading={isLoading} />
      <CrudFeedback feedback={feedback} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statEntries.map((stat, index) => (
          <div key={index} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-sm font-medium ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                环比{formatChange(stat.change)}
                <Activity size={12} />
              </span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{formatNumber(stat.value)}</h3>
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.tip && (
                <span className="relative group/tip cursor-help">
                  <Info size={14} className="text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl whitespace-normal w-56 text-left opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 pointer-events-none z-50">
                    {stat.tip}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800" />
                  </span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card min-h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart size={20} className="text-primary" />
              每日趋势
              <span className="text-xs font-normal text-muted-foreground ml-1">近{windowDays}天每日认证事件 / 注册 / 上传作品数量</span>
            </h3>
            <select
              value={String(windowDays)}
              onChange={(event) => setWindowDays(Number(event.target.value) as OverviewWindow)}
              className="bg-zinc-800 border border-border rounded-lg text-sm px-3 py-1 text-white outline-none cursor-pointer hover:bg-zinc-700 transition-colors"
            >
              <option value="7">最近7天</option>
              <option value="30">最近30天</option>
            </select>
          </div>
          <div className="flex-1 border border-border/50 rounded-lg p-4 bg-background/30">
            {data.trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                暂无趋势数据
              </div>
            ) : (
              <div className="space-y-3">
                {data.trend.map((item) => (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span>认证 {item.visits} / 注册 {item.registrations} / 上传 {item.uploads}</span>
                    </div>
                    <div className="h-2 rounded bg-secondary/70 overflow-hidden flex">
                      <div
                        className="bg-green-500/80"
                        style={{ width: `${(item.visits / maxTrendValue) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500/80"
                        style={{ width: `${(item.registrations / maxTrendValue) * 100}%` }}
                      />
                      <div
                        className="bg-purple-500/80"
                        style={{ width: `${(item.uploads / maxTrendValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card min-h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart size={20} className="text-purple-500" />
              操作分布
              <span className="text-xs font-normal text-muted-foreground ml-1">近{windowDays}天各类型操作次数占比</span>
            </h3>
            <span className="text-xs text-muted-foreground">当前窗口</span>
          </div>
          <div className="flex-1 border border-border/50 rounded-lg p-4 bg-background/30">
            {data.distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                暂无分布数据
              </div>
            ) : (
              <div className="space-y-4">
                {data.distribution.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground flex items-center gap-1.5">
                        {item.label}
                        {item.tip && (
                          <span className="relative group/dist cursor-help">
                            <Info size={12} className="text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl whitespace-normal w-52 text-left opacity-0 invisible group-hover/dist:opacity-100 group-hover/dist:visible transition-all duration-200 pointer-events-none z-50">
                              {item.tip}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800" />
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                    </div>
                    <div className="h-2 rounded bg-secondary/70 overflow-hidden">
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: `${(item.value / maxDistributionValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Card className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">最新动态</h3>
            <p className="text-xs text-muted-foreground mt-0.5">最近10条用户注册与作品上传记录</p>
          </div>
        </div>
        <div className="p-6">
          {data.latestActivities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
              暂无动态
            </div>
          ) : (
            data.latestActivities.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  {item.type === 'upload' ? <Upload size={20} /> : <Users size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </span>
                  <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                    {item.status === 'success' ? '成功' : '失败'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
