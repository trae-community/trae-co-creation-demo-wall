'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2, Trophy, MapPin, FileText, Users, Eye, ThumbsUp, Crown, Medal, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Data Types ──
interface CityRankingItem {
  code: string
  name: string
  nameI18n: Record<string, string>
  province: { name: string; nameI18n: Record<string, string> } | null
  approvedCount: number
  totalViews: number
  totalLikes: number
}

interface WorkRankingItem {
  id: string
  title: string
  coverUrl: string | null
  summary: string | null
  author: string
  views: number
  likes: number
}

interface CreatorRankingItem {
  userId: string
  username: string
  avatarUrl: string | null
  workCount: number
  totalViews: number
  totalLikes: number
}

interface RankingsData {
  cityRanking: CityRankingItem[]
  worksRanking: {
    byViews: WorkRankingItem[]
    byLikes: WorkRankingItem[]
  }
  creatorsRanking: {
    byWorks: CreatorRankingItem[]
    byViews: CreatorRankingItem[]
    byLikes: CreatorRankingItem[]
  }
}

type MainTab = 'cities' | 'works' | 'creators'
type SortKey = 'works' | 'views' | 'likes'

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

const rankBadge = (index: number) => {
  if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />
  if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />
  if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm text-zinc-500 w-5 text-center inline-block">{index + 1}</span>
}

const rankRowBg = (index: number) => {
  if (index === 0) return 'border-yellow-500/20 bg-yellow-500/5'
  if (index === 1) return 'border-gray-400/15 bg-gray-400/5'
  if (index === 2) return 'border-amber-600/15 bg-amber-600/5'
  return 'border-white/5 bg-white/[0.02]'
}

export default function RankingsPage() {
  const t = useTranslations('Rankings')
  const locale = useLocale()
  const router = useRouter()
  const [data, setData] = useState<RankingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainTab, setMainTab] = useState<MainTab>('cities')
  const [sortKey, setSortKey] = useState<SortKey>('works')

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/rankings')
        if (!res.ok) throw new Error('Failed to fetch')
        const payload = await res.json()
        setData(payload)
      } catch {
        setError(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchRankings()
  }, [t])

  // When switching mainTab, reset sortKey to a sensible default
  const handleMainTab = (tab: MainTab) => {
    setMainTab(tab)
    if (tab === 'cities') setSortKey('works')
    else if (tab === 'works') setSortKey('views')
    else setSortKey('works')
  }

  const localizedCityName = (city: CityRankingItem) => city.nameI18n[locale] || city.name
  const localizedProvinceName = (city: CityRankingItem) => city.province ? (city.province.nameI18n[locale] || city.province.name) : ''

  // ── Sorted data ──
  const sortedCities = useMemo(() => {
    if (!data) return []
    const arr = [...data.cityRanking]
    if (sortKey === 'views') arr.sort((a, b) => b.totalViews - a.totalViews)
    else if (sortKey === 'likes') arr.sort((a, b) => b.totalLikes - a.totalLikes)
    // default is by works (already sorted from API)
    return arr
  }, [data, sortKey])

  const sortedWorks = useMemo(() => {
    if (!data) return []
    return sortKey === 'likes' ? data.worksRanking.byLikes : data.worksRanking.byViews
  }, [data, sortKey])

  const sortedCreators = useMemo(() => {
    if (!data) return []
    if (sortKey === 'views') return data.creatorsRanking.byViews
    if (sortKey === 'likes') return data.creatorsRanking.byLikes
    return data.creatorsRanking.byWorks
  }, [data, sortKey])

  const mainTabs: { key: MainTab; icon: any; label: string }[] = [
    { key: 'cities', icon: MapPin, label: t('cityRanking') },
    { key: 'works', icon: FileText, label: t('workRanking') },
    { key: 'creators', icon: Users, label: t('creatorRanking') },
  ]

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'works', label: t('byWorks') },
    { key: 'views', label: t('byViews') },
    { key: 'likes', label: t('byLikes') },
  ]

  // Max value for progress bar
  const cityMax = useMemo(() => {
    if (sortKey === 'views') return Math.max(...sortedCities.map(c => c.totalViews), 1)
    if (sortKey === 'likes') return Math.max(...sortedCities.map(c => c.totalLikes), 1)
    return Math.max(...sortedCities.map(c => c.approvedCount), 1)
  }, [sortedCities, sortKey])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-primary">
          <Trophy className="w-6 h-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">{t('title')}</h1>
        </div>
        <p className="text-zinc-400 text-sm">{t('subtitle')}</p>
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex items-center justify-center gap-2">
        {mainTabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleMainTab(key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all",
              mainTab === key
                ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-bold border-transparent shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Sub Sort ── */}
      <div className="flex items-center justify-center gap-2">
        {sortOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              sortKey === key
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="space-y-3">
        {/* City Ranking */}
        {mainTab === 'cities' && (
          sortedCities.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">{t('noData')}</div>
          ) : (
            sortedCities.map((city, idx) => {
              const barValue = sortKey === 'views' ? city.totalViews
                : sortKey === 'likes' ? city.totalLikes
                : city.approvedCount
              const barPercent = Math.round((barValue / cityMax) * 100)
              return (
                <div
                  key={city.code}
                  className={cn(
                    "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10",
                    rankRowBg(idx)
                  )}
                >
                  {/* Rank */}
                  <div className="shrink-0 w-8 flex justify-center">{rankBadge(idx)}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{localizedCityName(city)}</span>
                      {city.province && (
                        <span className="text-xs text-zinc-500">{localizedProvinceName(city)}</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] transition-all duration-500"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">{t('works')}</p>
                      <p className="text-white font-semibold">{formatNumber(city.approvedCount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">{t('views')}</p>
                      <p className="text-white font-semibold">{formatNumber(city.totalViews)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-500 text-xs">{t('likes')}</p>
                      <p className="text-white font-semibold">{formatNumber(city.totalLikes)}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )
        )}

        {/* Works Ranking */}
        {mainTab === 'works' && (
          sortedWorks.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">{t('noData')}</div>
          ) : (
            sortedWorks.map((work, idx) => (
              <div
                key={work.id}
                onClick={() => router.push(`/${locale}/works/${work.id}`)}
                className={cn(
                  "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10 cursor-pointer group",
                  rankRowBg(idx)
                )}
              >
                {/* Rank */}
                <div className="shrink-0 w-8 flex justify-center">{rankBadge(idx)}</div>

                {/* Cover */}
                <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-zinc-900">
                  {work.coverUrl ? (
                    <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate group-hover:text-primary transition-colors">{work.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t('author')}: {work.author}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Eye className="w-3.5 h-3.5" />
                    {formatNumber(work.views)}
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {formatNumber(work.likes)}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Creators Ranking */}
        {mainTab === 'creators' && (
          sortedCreators.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">{t('noData')}</div>
          ) : (
            sortedCreators.map((creator, idx) => (
              <div
                key={creator.userId}
                className={cn(
                  "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10",
                  rankRowBg(idx)
                )}
              >
                {/* Rank */}
                <div className="shrink-0 w-8 flex justify-center">{rankBadge(idx)}</div>

                {/* Avatar */}
                <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{creator.username}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">{t('works')}</p>
                    <p className="text-white font-semibold">{formatNumber(creator.workCount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">{t('totalViews')}</p>
                    <p className="text-white font-semibold">{formatNumber(creator.totalViews)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">{t('totalLikes')}</p>
                    <p className="text-white font-semibold">{formatNumber(creator.totalLikes)}</p>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
