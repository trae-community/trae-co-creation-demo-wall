'use client'

import { Search, Plus, Filter, MoreHorizontal, Edit, Trash, Eye, Calendar, User } from 'lucide-react'

export default function ProjectsPage() {
  const projects = [
    { id: 1, title: 'AI 绘画助手', author: '张三', date: '2024-03-20', status: '已发布' },
    { id: 2, title: '智能客服系统', author: '李四', date: '2024-03-18', status: '审核中' },
    { id: 3, title: '数据可视化大屏', author: '王五', date: '2024-03-15', status: '草稿' },
    { id: 4, title: '企业官网模板', author: '赵六', date: '2024-03-10', status: '已发布' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h2 className="text-2xl font-bold tracking-tight">作品管理</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={16} />
          <span>新建作品</span>
        </button>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input 
            type="text" 
            placeholder="搜索作品名称、作者..." 
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">作品名称</th>
                <th className="px-6 py-4 font-medium">作者</th>
                <th className="px-6 py-4 font-medium">状态</th>
                <th className="px-6 py-4 font-medium">创建时间</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border hover:bg-secondary/20 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                        IMG
                      </div>
                      {project.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User size={14} />
                      {project.author}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      project.status === '已发布' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      project.status === '审核中' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {project.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="查看">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-secondary rounded-lg text-blue-500 hover:text-blue-400 transition-colors" title="编辑">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-secondary rounded-lg text-red-500 hover:text-red-400 transition-colors" title="删除">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <div>显示 1-4 共 4 条记录</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50" disabled>上一页</button>
            <button className="px-3 py-1 rounded border border-border hover:bg-secondary">下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}
