'use client'

import { Search, Plus, Filter, MapPin, MoreVertical, Edit, Trash } from 'lucide-react'

export default function CitiesPage() {
  const cities = [
    { id: 1, name: '北京', code: '110000', users: 1200, status: '启用' },
    { id: 2, name: '上海', code: '310000', users: 980, status: '启用' },
    { id: 3, name: '广州', code: '440100', users: 850, status: '启用' },
    { id: 4, name: '深圳', code: '440300', users: 920, status: '启用' },
    { id: 5, name: '杭州', code: '330100', users: 650, status: '启用' },
    { id: 6, name: '成都', code: '510100', users: 580, status: '禁用' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h2 className="text-2xl font-bold tracking-tight">城市管理</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={16} />
          <span>添加城市</span>
        </button>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input 
            type="text" 
            placeholder="搜索城市名称、代码..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-colors">
            <Filter size={16} />
            <span>筛选</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cities.map((city) => (
          <div key={city.id} className="relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button className="p-1.5 rounded-lg bg-secondary/80 hover:bg-primary text-foreground hover:text-primary-foreground transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
            
            <div className="h-32 bg-secondary relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    {city.name}
                  </h3>
                  <p className="text-sm text-gray-300">{city.code}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">注册用户</span>
                <span className="font-medium text-foreground">{city.users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">状态</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  city.status === '启用' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {city.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm transition-colors">
                  <Edit size={14} />
                  编辑
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-sm transition-colors">
                  <Trash size={14} />
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer min-h-[300px] group">
          <div className="w-16 h-16 rounded-full bg-secondary group-hover:bg-primary/20 mb-4 flex items-center justify-center transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-medium">添加新城市</span>
        </div>
      </div>
    </div>
  )
}
