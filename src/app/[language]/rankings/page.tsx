'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Trophy, MapPin, FileText, Users, Eye, ThumbsUp, Crown, Medal, User, Flame, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/language/navigation'

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
  createdAt: string | null
  author: {
    id: string
    name: string
    avatarUrl: string | null
  }
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

interface TrendingWork {
  id: string
  title: string
  coverUrl: string | null
  createdAt: string | null
  author: {
    id: string
    name: string
    avatarUrl: string | null
  }
  views: number
  likes: number
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
  trendingWorks: TrendingWork[]
}

type MainTab = 'trending' | 'cities' | 'works' | 'creators'
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

// ── Minimal Podium (Top 3) ──
interface PodiumStat {
  icon?: any
  label: string
  value: number
}

interface PodiumItem {
  image?: string | null
  imageShape?: 'cover' | 'avatar' | 'icon'
  title: string
  subtitle?: string
  stats: PodiumStat[]
  onClick?: () => void
}

function StatRow({ stats, small }: { stats: PodiumStat[]; small?: boolean }) {
  return (
    <div className={cn("flex items-center flex-wrap", small ? "gap-3 text-xs" : "gap-4 text-sm")}>
      {stats.map(({ icon: Icon, label, value }) => (
        <span key={label} className="flex items-center gap-1.5">
          {Icon ? (
            <Icon className={cn("text-zinc-400", small ? "w-3 h-3" : "w-3.5 h-3.5")} />
          ) : (
            <span className={cn("text-zinc-500", small ? "text-[10px]" : "text-xs")}>{label}</span>
          )}
          <span className="text-white font-semibold"><AnimatedNumber value={value} format={formatNumber} /></span>
        </span>
      ))}
    </div>
  )
}

function TopBarCard({ item, rank }: { item: PodiumItem; rank: 0 | 1 | 2 }) {
  const hasCover = item.imageShape === 'cover' && !!item.image
  const isCity = item.imageShape === 'icon'

  return (
    <div
      onClick={item.onClick}
      className={cn(
        "relative rounded-xl border p-4 flex items-center gap-4 transition-all",
        rank === 0 ? "border-yellow-500/20 bg-yellow-500/[0.04]"
          : rank === 1 ? "border-gray-400/15 bg-gray-400/5"
          : "border-amber-600/15 bg-amber-600/5",
        item.onClick && "cursor-pointer hover:bg-white/[0.06]"
      )}
    >
      {/* Rank badge */}
      <div className={cn(
        "shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-sm",
        rank === 0 ? "bg-yellow-400 text-black"
          : rank === 1 ? "bg-gray-300 text-black"
          : "bg-amber-600 text-white"
      )}>
        {rank + 1}
      </div>

      {/* Image / Icon thumbnail */}
      {hasCover ? (
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-zinc-900">
          <img src={item.image!} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : isCity ? (
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-zinc-900/50 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-zinc-600" />
        </div>
      ) : item.imageShape === 'avatar' && item.image ? (
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-900">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-900/50 flex items-center justify-center">
          <User className="w-7 h-7 text-zinc-600" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate text-base md:text-lg">{item.title}</h4>
        {item.subtitle && <p className="text-zinc-500 text-xs truncate mt-1">{item.subtitle}</p>}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-400 hidden sm:flex">
        {item.stats.slice(0, 3).map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-1.5">
            {Icon ? (
              <Icon className="w-3.5 h-3.5 text-zinc-500" />
            ) : null}
            <span className="font-medium text-white"><AnimatedNumber value={value} format={formatNumber} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpotlightPodium({ first, second, third }: { first: PodiumItem; second: PodiumItem; third: PodiumItem }) {
  return (
    <div className="space-y-2">
      <TopBarCard item={first} rank={0} />
      <TopBarCard item={second} rank={1} />
      <TopBarCard item={third} rank={2} />
    </div>
  )
}

// Count-up animation hook
function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (target === 0) { setCurrent(0); return }
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCurrent(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return current
}

// Animated number component for use inside maps
function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const current = useCountUp(value)
  return <>{format ? format(current) : current}</>
}

export default function RankingsPage() {
  const t = useTranslations('Rankings')
  const locale = useLocale()
  const router = useRouter()
  const [data, setData] = useState<RankingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainTab, setMainTab] = useState<MainTab>('creators')
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
    else if (tab === 'creators') setSortKey('works')
    // trending has no sortKey
  }

  const localizedCityName = (city: CityRankingItem) => city.nameI18n[locale] || city.name
  const localizedProvinceName = (city: CityRankingItem) => city.province ? (city.province.nameI18n[locale] || city.province.name) : ''

  // ── Podium item builders ──
  const cityPodiumItem = (city: CityRankingItem): PodiumItem => ({
    imageShape: 'icon',
    title: localizedCityName(city),
    subtitle: localizedProvinceName(city),
    stats: [
      { icon: FileText, label: t('works'), value: city.approvedCount },
      { icon: Eye, label: t('views'), value: city.totalViews },
      { icon: ThumbsUp, label: t('likes'), value: city.totalLikes },
    ],
  })

  const workPodiumItem = (work: WorkRankingItem): PodiumItem => ({
    image: work.coverUrl,
    imageShape: 'cover',
    title: work.title,
    subtitle: work.author.name,
    stats: [
      { icon: Eye, label: t('views'), value: work.views },
      { icon: ThumbsUp, label: t('likes'), value: work.likes },
    ],
    onClick: () => router.push(`/${locale}/works/${work.id}?from=${encodeURIComponent(`/${locale}/rankings`)}`),
  })

  const creatorPodiumItem = (creator: CreatorRankingItem): PodiumItem => ({
    image: creator.avatarUrl,
    imageShape: 'avatar',
    title: creator.username,
    stats: [
      { icon: FileText, label: t('works'), value: creator.workCount },
      { icon: Eye, label: t('totalViews'), value: creator.totalViews },
      { icon: ThumbsUp, label: t('totalLikes'), value: creator.totalLikes },
    ],
    onClick: () => router.push(`/${locale}/user/${creator.userId}?from=${encodeURIComponent(`/${locale}/rankings`)}`),
  })

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
    { key: 'trending', icon: Flame, label: t('trending') },
    { key: 'creators', icon: Users, label: t('creatorRanking') },
    { key: 'cities', icon: MapPin, label: t('cityRanking') },
    { key: 'works', icon: FileText, label: t('workRanking') },
  ]

  const sortOptions: { key: SortKey; label: string }[] = mainTab === 'works'
    ? [
        { key: 'views', label: t('byViews') },
        { key: 'likes', label: t('byLikes') },
      ]
    : [
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mx-auto" />
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 w-28 rounded-full bg-white/5 animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-4">
                {[1, 2, 3].map(j => <div key={j} className="h-8 w-12 bg-white/5 rounded animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
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
                ? "bg-gradient-to-r from-[#32F08C] to-[#17D479] text-black font-bold border-transparent shadow-[0_0_12px_rgba(50,240,140,0.25)]"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Sub Sort (hidden for trending) ── */}
      {mainTab !== 'trending' && (
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
      )}

      {/* ── Top 3 Spotlight Podium ── */}
      {mainTab === 'cities' && sortedCities.length >= 3 && (
        <SpotlightPodium
          first={cityPodiumItem(sortedCities[0])}
          second={cityPodiumItem(sortedCities[1])}
          third={cityPodiumItem(sortedCities[2])}
        />
      )}
      {mainTab === 'works' && sortedWorks.length >= 3 && (
        <SpotlightPodium
          first={workPodiumItem(sortedWorks[0])}
          second={workPodiumItem(sortedWorks[1])}
          third={workPodiumItem(sortedWorks[2])}
        />
      )}
      {mainTab === 'creators' && sortedCreators.length >= 3 && (
        <SpotlightPodium
          first={creatorPodiumItem(sortedCreators[0])}
          second={creatorPodiumItem(sortedCreators[1])}
          third={creatorPodiumItem(sortedCreators[2])}
        />
      )}

      {/* ── Content ── */}
      <div className="space-y-3">
        {/* City Ranking */}
        {mainTab === 'cities' && (
          sortedCities.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">{t('noData')}</div>
          ) : (
            sortedCities.slice(3).map((city, idx) => {
              const actualRank = idx + 3
              const barValue = sortKey === 'views' ? city.totalViews
                : sortKey === 'likes' ? city.totalLikes
                : city.approvedCount
              const barPercent = Math.round((barValue / cityMax) * 100)
              return (
                <div
                  key={city.code}
                  className={cn(
                    "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10",
                    rankRowBg(actualRank)
                  )}
                >
                  {/* Rank */}
                  <div className="shrink-0 w-8 flex justify-center">{rankBadge(actualRank)}</div>

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
                        className="h-full rounded-full bg-gradient-to-r from-[#32F08C] to-[#17D479] transition-all duration-500 progress-glow"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className={cn("flex items-center gap-1.5", sortKey !== 'works' && "opacity-50")}>
                      <FileText className={cn("w-3.5 h-3.5", sortKey === 'works' ? "text-primary" : "text-zinc-500")} />
                      <span className={cn("font-semibold", sortKey === 'works' ? "text-primary" : "text-white")}><AnimatedNumber value={city.approvedCount} /></span>
                    </div>
                    <div className={cn("flex items-center gap-1.5", sortKey !== 'views' && "opacity-50")}>
                      <Eye className={cn("w-3.5 h-3.5", sortKey === 'views' ? "text-primary" : "text-zinc-500")} />
                      <span className={cn("font-semibold", sortKey === 'views' ? "text-primary" : "text-white")}><AnimatedNumber value={city.totalViews} format={formatNumber} /></span>
                    </div>
                    <div className={cn("flex items-center gap-1.5", sortKey !== 'likes' && "opacity-50")}>
                      <ThumbsUp className={cn("w-3.5 h-3.5", sortKey === 'likes' ? "text-primary" : "text-zinc-500")} />
                      <span className={cn("font-semibold", sortKey === 'likes' ? "text-primary" : "text-white")}><AnimatedNumber value={city.totalLikes} format={formatNumber} /></span>
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
            sortedWorks.slice(3).map((work, idx) => (
              <div
                key={work.id}
                onClick={() => router.push(`/${locale}/works/${work.id}?from=${encodeURIComponent(`/${locale}/rankings`)}`)}
                className={cn(
                  "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10 cursor-pointer group",
                  rankRowBg(idx + 3)
                )}
              >
                {/* Rank */}
                <div className="shrink-0 w-8 flex justify-center">{rankBadge(idx + 3)}</div>

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
                  <p className="text-xs text-zinc-500 mt-0.5">{t('author')}: <Link href={`/user/${work.author.id}?from=${encodeURIComponent(`/${locale}/rankings`)}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">{work.author.name}</Link></p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-white font-semibold"><AnimatedNumber value={work.views} format={formatNumber} /></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-white font-semibold"><AnimatedNumber value={work.likes} format={formatNumber} /></span>
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
            sortedCreators.slice(3).map((creator, idx) => (
              <Link
                key={creator.userId}
                href={`/user/${creator.userId}`}
                className={cn(
                  "rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/10 cursor-pointer group",
                  rankRowBg(idx + 3)
                )}
              >
                {/* Rank */}
                <div className="shrink-0 w-8 flex justify-center">{rankBadge(idx + 3)}</div>

                {/* Avatar */}
                <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate group-hover:text-primary transition-colors">{creator.username}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-white font-semibold"><AnimatedNumber value={creator.workCount} /></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-white font-semibold"><AnimatedNumber value={creator.totalViews} format={formatNumber} /></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-white font-semibold"><AnimatedNumber value={creator.totalLikes} format={formatNumber} /></span>
                  </div>
                </div>
              </Link>
            ))
          )
        )}

        {/* Trending Works (7-day) */}
        {mainTab === 'trending' && (
          data?.trendingWorks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Flame className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">{t('noTrendingData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.trendingWorks || []).map((work, idx) => (
                <div
                  key={work.id}
                  onClick={() => router.push(`/${locale}/works/${work.id}?from=${encodeURIComponent(`/${locale}/rankings`)}`)}
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
                    <div className="flex items-center gap-2 mt-0.5">
                      {work.author.avatarUrl && (
                        <img src={work.author.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span className="text-xs text-zinc-500">{work.author.name}</span>
                      {work.createdAt && (
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(work.createdAt).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-white font-semibold"><AnimatedNumber value={work.views} format={formatNumber} /></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-white font-semibold"><AnimatedNumber value={work.likes} format={formatNumber} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
