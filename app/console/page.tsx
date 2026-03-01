'use client'

import { Users, FileText, Database, TrendingUp, Activity, PieChart, BarChart } from 'lucide-react'

export default function ConsolePage() {
  const stats = [
    { label: '总作品数', value: '128', icon: FileText, change: '+12%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '活跃用户', value: '2,845', icon: Users, change: '+5.4%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '字典条目', value: '86', icon: Database, change: '+0.2%', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: '系统访问', value: '45.2k', icon: TrendingUp, change: '+24%', color: 'text-green-500', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                {stat.change}
                <Activity size={12} />
              </span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart size={20} className="text-primary" />
              访问趋势
            </h3>
            <select className="bg-secondary/50 border border-border rounded-lg text-sm px-3 py-1 text-muted-foreground outline-none">
              <option>最近7天</option>
              <option>最近30天</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
            图表组件占位区
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart size={20} className="text-purple-500" />
              数据分布
            </h3>
            <button className="text-sm text-primary hover:underline">查看详情</button>
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
            饼图组件占位区
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">最新动态</h3>
        </div>
        <div className="p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">新用户注册: User_{1000 + i}</p>
                <p className="text-xs text-muted-foreground">2分钟前</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                成功
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
