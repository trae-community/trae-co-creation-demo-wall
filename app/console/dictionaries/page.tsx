'use client'

import { Search, Plus, Filter, Database, Edit, Trash, Settings } from 'lucide-react'

export default function DictionariesPage() {
  const dicts = [
    { id: 1, name: '用户类型', code: 'user_type', items: 3, updated: '2024-03-20' },
    { id: 2, name: '项目状态', code: 'project_status', items: 5, updated: '2024-03-18' },
    { id: 3, name: '城市列表', code: 'city_list', items: 128, updated: '2024-03-15' },
    { id: 4, name: '系统配置', code: 'system_config', items: 10, updated: '2024-03-10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h2 className="text-2xl font-bold tracking-tight">字典管理</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={16} />
          <span>新建字典</span>
        </button>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input 
            type="text" 
            placeholder="搜索字典名称、编码..." 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dicts.map((dict) => (
          <div key={dict.id} className="group relative rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Database size={24} />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="配置">
                  <Settings size={16} />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg text-blue-500 hover:text-blue-400 transition-colors" title="编辑">
                  <Edit size={16} />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg text-red-500 hover:text-red-400 transition-colors" title="删除">
                  <Trash size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{dict.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 font-mono">{dict.code}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-muted-foreground">
              <span>{dict.items} 个条目</span>
              <span>更新于 {dict.updated}</span>
            </div>
          </div>
        ))}
        
        <div className="group rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer min-h-[200px]">
          <div className="p-4 rounded-full bg-secondary group-hover:bg-primary/20 mb-4 transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-medium">添加新字典</span>
        </div>
      </div>
    </div>
  )
}
