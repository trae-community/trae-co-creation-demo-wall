'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { MapPin, Building2, Eye, ThumbsUp, FileText, Clock, TrendingUp, Filter, X } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CityStats {
  id: string
  code: string
  name: string
  nameI18n: Record<string, string>
  parentValue: string | null
  totalWorks: number
  approvedCount: number
  pendingCount: number
  totalViews: number
  totalLikes: number
}

interface FilterOption {
  label: string
  value: string
}

export default function CitiesPage() {
  const t = useTranslations('Cities')
  const locale = useLocale()
  const [stats, setStats] = useState<CityStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 筛选状态
  const [countries, setCountries] = useState<FilterOption[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  // 加载省份选项
  useEffect(() => {
    const loadCountries = async () => {
      const apiLang = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : locale
      try {
        const res = await fetch(`/api/dictionaries?code=country&lang=${apiLang}`)
        if (res.ok) {
          const data = await res.json()
          setCountries((data.items || []).map((item: { itemLabel: string; itemValue: string }) => ({
            label: item.itemLabel,
            value: item.itemValue
          })))
        }
      } catch (error) {
        console.error('Failed to load countries:', error)
      }
    }
    loadCountries()
  }, [locale])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/console/cities/stats')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setStats(data.items || [])
      } catch (err) {
        setError(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [t])

  // 根据省份筛选城市
  const filteredStats = useMemo(() => {
    if (!selectedCountry) return stats
    return stats.filter((city) => city.parentValue === selectedCountry)
  }, [stats, selectedCountry])

  // 计算汇总数据（基于筛选结果）
  const summary = useMemo(() => {
    const activeCities = filteredStats.filter((s) => s.approvedCount > 0)
    return {
      totalCities: filteredStats.length,
      activeCities: activeCities.length,
      totalWorks: filteredStats.reduce((sum, s) => sum + s.approvedCount, 0),
      totalViews: filteredStats.reduce((sum, s) => sum + s.totalViews, 0),
      totalLikes: filteredStats.reduce((sum, s) => sum + s.totalLikes, 0),
    }
  }, [filteredStats])

  // 获取城市名称（根据当前语言）
  const getCityName = (city: CityStats) => {
    return city.nameI18n[locale] || city.name
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={16} />
          <span className="text-sm font-medium">{t('filterByProvince')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCountry('')}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-all",
              selectedCountry === ''
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {t('allProvinces')}
          </button>
          {countries.map((country) => (
            <button
              key={country.value}
              onClick={() => setSelectedCountry(country.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                selectedCountry === country.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {country.label}
            </button>
          ))}
        </div>
        {selectedCountry && (
          <button
            onClick={() => setSelectedCountry('')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={12} />
            {t('clearFilter')}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Building2 size={16} />
            {t('totalCities')}
          </div>
          <p className="text-2xl font-bold">{summary.totalCities}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp size={16} />
            {t('activeCities')}
          </div>
          <p className="text-2xl font-bold text-primary">{summary.activeCities}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <FileText size={16} />
            {t('totalWorks')}
          </div>
          <p className="text-2xl font-bold">{summary.totalWorks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Eye size={16} />
            {t('totalViews')}
          </div>
          <p className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* City Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStats.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('noCitiesInProvince')}
          </div>
        ) : (
          filteredStats.map((city) => (
          <div
            key={city.id}
            className="rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden"
          >
            {/* Header */}
            <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
              <div className="absolute inset-0 flex items-end p-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shadow-sm">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{getCityName(city)}</h3>
                    <p className="text-xs text-muted-foreground">{city.code}</p>
                  </div>
                </div>
              </div>
              {city.approvedCount > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/20">
                    {t('hasWorks')}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3">
              {/* Works */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} />
                  {t('approvedWorks')}
                </span>
                <span className="font-semibold">{city.approvedCount}</span>
              </div>
              {city.pendingCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock size={14} />
                    {t('pendingWorks')}
                  </span>
                  <span className="text-sm text-yellow-500">{city.pendingCount}</span>
                </div>
              )}

              {/* Divider */}
              {city.approvedCount > 0 && (
                <>
                  <div className="h-px bg-border" />
                  {/* Views & Likes */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Eye size={14} />
                      {t('views')}
                    </span>
                    <span className="font-medium">{city.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ThumbsUp size={14} />
                      {t('likes')}
                    </span>
                    <span className="font-medium">{city.totalLikes.toLocaleString()}</span>
                  </div>
                </>
              )}

              {/* Empty State */}
              {city.approvedCount === 0 && (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  {t('noWorks')}
                </div>
              )}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  )
}