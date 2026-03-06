'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/language/navigation'
import { useTranslations } from 'next-intl'
import { Eye, ThumbsUp, ArrowRight, Loader2 } from 'lucide-react'

interface LikedWork {
  id: string
  name: string
  intro: string
  coverUrl: string
  views: number
  likes: number
  tags: string[]
  author: {
    name: string
    avatar: string | null
  }
}

interface LikedWorksProps {
  userId: string
}

export function LikedWorks({ userId }: LikedWorksProps) {
  const t = useTranslations('Profile')
  const [works, setWorks] = useState<LikedWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 3

  useEffect(() => {
    const fetchLikedWorks = async () => {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
        })
        const res = await fetch(`/api/works/likes?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setWorks(data.items || [])
          setTotalItems(data.total || 0)
          setTotalPages(data.totalPages || 1)
        }
      } catch (error) {
        console.error('Failed to fetch liked works:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLikedWorks()
  }, [userId, currentPage])

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {works.map((work) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="group block rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="aspect-video relative bg-zinc-800">
              {work.coverUrl ? (
                <img src={work.coverUrl} alt={work.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Cover
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">
                {work.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {work.intro || 'No description'}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {work.views}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {work.likes}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {works.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          {t('noLikedWorks')}
        </div>
      )}

      {!isLoading && works.length > 0 && (
        <div className="p-4 border border-border rounded-xl bg-card flex items-center justify-between text-sm text-muted-foreground">
          <div>显示 {startIndex}-{endIndex} 共 {totalItems} 条记录</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              上一页
            </button>
            <button
              className="px-3 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
