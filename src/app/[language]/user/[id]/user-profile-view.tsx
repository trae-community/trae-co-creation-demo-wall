'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, User, Eye, ThumbsUp, Calendar, Sparkles } from 'lucide-react'
import { Link } from '@/lib/language/navigation'

interface PublicWork {
  id: string
  title: string
  summary: string | null
  coverUrl: string | null
  countryCode: string | null
  cityCode: string | null
  createdAt: string
  views: number
  likes: number
  tags: string[]
  honors: string[]
}

interface PublicProfile {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
  workCount: number
  totalViews: number
  totalLikes: number
  joinedAt: string
}

export function UserProfileView() {
  const t = useTranslations('UserProfile')
  const locale = useLocale()
  const params = useParams()
  const id = params?.id as string

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [works, setWorks] = useState<PublicWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    setError('')
    fetch(`/api/profile/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error('not_found')
        if (!r.ok) throw new Error('fetch_error')
        return r.json()
      })
      .then((data) => {
        setProfile(data.profile)
        setWorks(data.works || [])
      })
      .catch((err) => {
        setError(err.message === 'not_found' ? t('notFound') : t('loadError'))
      })
      .finally(() => setIsLoading(false))
  }, [id, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || t('notFound')}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Card */}
      <section className="rounded-3xl border border-white/10 bg-card/80 backdrop-blur-md p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">{profile.username}</h1>
            {profile.bio && (
              <p className="text-gray-400 mt-1 text-sm line-clamp-2">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-gray-400">{t('works')}</span>
            <span className="text-white font-semibold">{profile.workCount}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span className="text-gray-400">{t('views')}</span>
            <span className="text-white font-semibold">{profile.totalViews}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-gray-400">{t('likes')}</span>
            <span className="text-white font-semibold">{profile.totalLikes}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            {t('joinedAt')}: {new Date(profile.joinedAt).toLocaleDateString(locale)}
          </div>
        </div>
      </section>

      {/* Works Grid */}
      <section>
        {works.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {works.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_32px_rgba(34,197,94,0.2)] hover:border-green-500/35"
                style={{ background: '#111318' }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  {work.coverUrl ? (
                    <img
                      src={work.coverUrl}
                      alt={work.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x450?text=No+Image'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 bg-zinc-800">
                      No Image
                    </div>
                  )}
                  {work.honors.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {work.honors.slice(0, 2).map((honor) => (
                        <span
                          key={honor}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-950 border border-amber-300/60"
                          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                        >
                          {honor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-green-400 transition-colors">
                    {work.title}
                  </h3>
                  {work.summary && (
                    <p className="text-zinc-500 text-xs line-clamp-2 mb-3">{work.summary}</p>
                  )}

                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-white/6 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {work.views >= 1000 ? `${(work.views / 1000).toFixed(1)}k` : work.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {work.likes}
                    </span>
                    <span className="ml-auto">
                      {new Date(work.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-zinc-400 text-sm">{t('noWorks')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
