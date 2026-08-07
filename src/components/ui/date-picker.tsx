'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  /** 未选中日期时的占位文案 */
  placeholder?: string
  className?: string
}

const WEEKDAYS_ZH = ['一', '二', '三', '四', '五', '六', '日']
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const WEEKDAYS_JA = ['月', '火', '水', '木', '金', '土', '日']

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(value: string, locale: string): string {
  if (!value) return ''
  const [, m, d] = value.split('-').map(Number)
  if (locale === 'zh') return `${m}月${d}日`
  if (locale === 'ja') return `${m}月${d}日`
  return `${m}/${d}`
}

/** 生成某月的日历网格（周一开头），返回 42 个日期项 */
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  // 周一=0 ... 周日=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: { date: string; inMonth: boolean }[] = []

  const startDate = new Date(year, month, 1 - startOffset)
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ date: iso, inMonth: d.getMonth() === month })
  }
  return days
}

export function DatePicker({ value, onChange, placeholder = '日期', className }: DatePickerProps) {
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  // 弹窗内当前展示的年月
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? new Date().getMonth())
  // 面板模式：日视图 / 选月 / 选年
  const [panel, setPanel] = useState<'day' | 'month' | 'year'>('day')
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((selected?.getFullYear() ?? new Date().getFullYear()) / 12) * 12)
  const containerRef = useRef<HTMLDivElement>(null)

  const weekdays = locale === 'zh' ? WEEKDAYS_ZH : locale === 'ja' ? WEEKDAYS_JA : WEEKDAYS_EN
  const months = locale === 'en' ? MONTHS_EN : MONTHS_ZH

  // 打开弹窗时定位到已选日期或今天
  useEffect(() => {
    if (isOpen) {
      const base = selected ?? new Date()
      setViewYear(base.getFullYear())
      setViewMonth(base.getMonth())
      setPanel('day')
      setYearRangeStart(Math.floor(base.getFullYear() / 12) * 12)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const todayIso = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })()

  const days = buildCalendarDays(viewYear, viewMonth)

  const goToPrev = () => {
    if (panel === 'day') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
      else setViewMonth(viewMonth - 1)
    } else if (panel === 'month') {
      setViewYear(viewYear - 1)
    } else {
      setYearRangeStart(yearRangeStart - 12)
    }
  }
  const goToNext = () => {
    if (panel === 'day') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
      else setViewMonth(viewMonth + 1)
    } else if (panel === 'month') {
      setViewYear(viewYear + 1)
    } else {
      setYearRangeStart(yearRangeStart + 12)
    }
  }

  // 点击标题逐级进入选月 / 选年面板
  const handleTitleClick = () => {
    if (panel === 'day') setPanel('month')
    else if (panel === 'month') setPanel('year')
  }
  const handleYearSelect = (y: number) => {
    setViewYear(y)
    setPanel('month')
  }
  const handleMonthSelect = (m: number) => {
    setViewMonth(m)
    setPanel('day')
  }

  const handleSelect = (date: string) => {
    onChange(date === value ? '' : date)
    setIsOpen(false)
  }

  const now = new Date()

  // 标题文案：日视图显示年月 / 选月显示年 / 选年显示年份区间
  const titleText = panel === 'day'
    ? (locale === 'en'
        ? `${new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long' })} ${viewYear}`
        : `${viewYear}年${viewMonth + 1}月`)
    : panel === 'month'
      ? (locale === 'en' ? `${viewYear}` : `${viewYear}年`)
      : `${yearRangeStart} - ${yearRangeStart + 11}`

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 触发按钮 — 与排序 tabs 风格一致 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all border',
          value
            ? 'bg-green-500/15 text-green-400 border-green-500/25'
            : 'text-zinc-500 border-transparent hover:text-white hover:bg-white/5'
        )}
      >
        <Calendar className="w-3 h-3" />
        <span className="hidden sm:inline">{value ? formatDate(value, locale) : placeholder}</span>
        <span className="sm:hidden">{value ? formatDate(value, locale) : placeholder}</span>
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* 日历弹窗 */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-[300px] rounded-2xl border border-white/10 p-4 shadow-2xl animate-dropdown-pop"
          style={{ background: '#111318' }}
        >
          {/* 导航：日视图按月翻页 / 选月按年翻页 / 选年按区间翻页 */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTitleClick}
              disabled={panel === 'year'}
              className={cn(
                'text-sm font-semibold text-zinc-200 px-2 py-1 rounded-lg transition-all',
                panel !== 'year' && 'hover:bg-white/10 cursor-pointer'
              )}
            >
              {titleText}
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {panel === 'day' && (
            <>
              {/* 星期表头 */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekdays.map((wd) => (
                  <span key={wd} className="text-center text-xs text-zinc-500 py-1 select-none">
                    {wd}
                  </span>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(({ date, inMonth }) => {
                  const isSelected = date === value
                  const isToday = date === todayIso
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleSelect(date)}
                      className={cn(
                        'h-8 rounded-lg text-sm transition-all',
                        inMonth ? 'text-zinc-200' : 'text-zinc-600',
                        isSelected
                          ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                          : 'hover:bg-white/10',
                        isToday && !isSelected && 'border border-green-500/40'
                      )}
                    >
                      {Number(date.split('-')[2])}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 选月面板 — 点击标题从日视图进入 */}
          {panel === 'month' && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((name, m) => {
                const isSelected = selected?.getFullYear() === viewYear && selected?.getMonth() === m
                const isCurrent = now.getFullYear() === viewYear && now.getMonth() === m
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleMonthSelect(m)}
                    className={cn(
                      'h-12 rounded-lg text-sm transition-all',
                      isSelected
                        ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                        : 'text-zinc-200 hover:bg-white/10',
                      isCurrent && !isSelected && 'border border-green-500/40'
                    )}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}

          {/* 选年面板 — 点击标题从选月进入，每页 12 年 */}
          {panel === 'year' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => {
                const isSelected = selected?.getFullYear() === y
                const isCurrent = now.getFullYear() === y
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      'h-12 rounded-lg text-sm transition-all',
                      isSelected
                        ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                        : 'text-zinc-200 hover:bg-white/10',
                      isCurrent && !isSelected && 'border border-green-500/40'
                    )}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          {/* 底部操作 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleSelect(todayIso)}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              {locale === 'zh' ? '今天' : locale === 'ja' ? '今日' : 'Today'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false) }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {locale === 'zh' ? '清除' : locale === 'ja' ? 'クリア' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
