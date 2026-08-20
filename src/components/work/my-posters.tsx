'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Trash2, ImageIcon, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/lib/language/navigation'
import { PosterImage } from '@/components/work/poster-image'
import { CrudPagination } from '@/components/crud/crud-pagination'
import { Button } from '@/components/ui/button'

interface MyPosterItem {
  id: string
  nickname: string
  description: string | null
  imageUrl: string
  demoUrl: string
  tags: string[] | null
  auditStatus: number
  createdAt: string
}

export function MyPosters() {
  const t = useTranslations('MyPosters')
  const tPosters = useTranslations('Posters')
  const [posters, setPosters] = useState<MyPosterItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 6

  const fetchPosters = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        mine: '1',
      })
      const res = await fetch(`/api/posters?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPosters(data.items || [])
        setTotalItems(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch my posters:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchPosters()
  }, [fetchPosters])

  const handleDelete = async (poster: MyPosterItem) => {
    if (!window.confirm(t('deleteConfirm'))) return
    setDeletingId(poster.id)
    try {
      const res = await fetch(`/api/posters/${poster.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('deleteSuccess'))
        // 当前页删空时回退一页
        if (posters.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        } else {
          fetchPosters()
        }
      } else {
        toast.error(t('deleteFailed'))
      }
    } catch {
      toast.error(t('deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  const statusBadge = (status: number) => {
    if (status === 1) {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/15 text-green-500 border border-green-500/30">{t('statusApproved')}</span>
    }
    if (status === 2) {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">{t('statusRejected')}</span>
    }
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">{t('statusPending')}</span>
  }

  const current = Math.min(currentPage, totalPages)
  const startIndex = totalItems === 0 ? 0 : (current - 1) * pageSize + 1
  const endIndex = Math.min(current * pageSize, totalItems)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posters.map((poster) => (
            <div key={poster.id} className="rounded-2xl overflow-hidden bg-card border border-border hover:border-green-500/40 transition-all">
              {/* 最终合成海报 */}
              <Link href={poster.auditStatus === 1 ? `/posters/${poster.id}` : '/poster-maker'} className="block relative overflow-hidden" style={{ aspectRatio: '283.46/425.2' }}>
                <PosterImage
                  nickname={poster.nickname}
                  description={poster.description}
                  imageUrl={poster.imageUrl}
                  demoUrl={poster.demoUrl}
                  qrText={tPosters('scanToExperience')}
                  fallbackTitle={poster.nickname}
                  anonymousLabel={poster.nickname}
                />
              </Link>
              {/* 信息 + 操作 */}
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-white text-base line-clamp-1 [overflow-wrap:anywhere]">{poster.nickname}</h3>
                    {statusBadge(poster.auditStatus)}
                  </div>
                </div>
                {/* Tags — 与作品卡片统一样式 */}
                {Array.isArray(poster.tags) && poster.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {poster.tags.slice(0, 3).map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="text-[10px] px-2 py-0.5 rounded-full border bg-white/5 text-zinc-600 border-white/10">{tag}</span>
                    ))}
                  </div>
                )}
                {/* Footer: time + delete — 与作品卡片统一样式 */}
                <div className="flex min-w-0 items-center justify-between gap-3 pt-3.5 border-t border-white/5 mt-auto">
                  <div className="flex min-w-0 items-center gap-1">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span className="text-[10px] text-zinc-600">
                      {new Date(poster.createdAt).getFullYear()}/{String(new Date(poster.createdAt).getMonth() + 1).padStart(2, '0')}/{String(new Date(poster.createdAt).getDate()).padStart(2, '0')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(poster)}
                    disabled={deletingId === poster.id}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    title={t('delete')}
                  >
                    {deletingId === poster.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('empty')}</p>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/poster-maker">
              <Plus className="w-4 h-4" />
              {t('createPoster')}
            </Link>
          </Button>
        </div>
      )}

      {posters.length > 0 && (
        <CrudPagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          current={current}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}
    </div>
  )
}
