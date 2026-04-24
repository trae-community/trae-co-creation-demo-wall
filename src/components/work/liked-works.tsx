'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Work } from '@/lib/types'
import { WorkCard } from '@/components/work/work-card'
import { CrudPagination } from '@/components/crud/crud-pagination'

interface LikedWorksProps {
  userId: string
}

export function LikedWorks({ userId }: LikedWorksProps) {
  const t = useTranslations('Profile')
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 6

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
      {works.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      ) : (
        <div className="col-span-full text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
          {t('noLikedWorks')}
        </div>
      )}

      {works.length > 0 && (
        <CrudPagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          current={current}
          totalPages={totalPages}
          onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}
    </div>
  )
}
