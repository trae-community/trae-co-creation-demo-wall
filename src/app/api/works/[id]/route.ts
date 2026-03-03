import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'value' in item) {
          return String((item as { value?: unknown }).value ?? '').trim()
        }
        return String(item).trim()
      })
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item)).filter(Boolean)
      }
    } catch {
      return value.split('\n').map(item => item.trim()).filter(Boolean)
    }
    return value.split('\n').map(item => item.trim()).filter(Boolean)
  }
  return []
}

const resolveLabelMap = (
  items: Array<{ itemValue: string; itemLabel: string; labelI18n: unknown }>,
  lang: string
) =>
  items.reduce<Record<string, string>>((acc, item) => {
    let label = item.itemLabel
    if (item.labelI18n && typeof item.labelI18n === 'object') {
      const i18n = item.labelI18n as Record<string, string>
      if (i18n[lang]) {
        label = i18n[lang]
      }
    }
    acc[item.itemValue] = label
    return acc
  }, {})

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const lang = searchParams.get('lang') || 'zh-CN'
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    const work = await prisma.workBase.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            email: true,
            bio: true
          }
        },
        statistic: {
          select: {
            viewCount: true,
            likeCount: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        honors: {
          include: {
            dictItem: true
          }
        },
        detail: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        team: true
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const [countryDict, cityDict, categoryDict] = await Promise.all([
      prisma.sysDict.findUnique({
        where: { dictCode: 'country' },
        include: { items: true }
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'city' },
        include: { items: true }
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'category_code' },
        include: { items: true }
      })
    ])

    const countryLabelMap = resolveLabelMap(countryDict?.items || [], lang)
    const cityLabelMap = resolveLabelMap(cityDict?.items || [], lang)
    const categoryLabelMap = resolveLabelMap(categoryDict?.items || [], lang)

    const features = toStringArray(work.detail?.highlights)
    const scenarios = toStringArray(work.detail?.scenarios)
    const teamMembers = toStringArray(work.team?.members)

    const item = {
      id: work.id.toString(),
      name: work.title || '',
      intro: work.summary || '',
      city: cityLabelMap[work.cityCode || ''] || work.cityCode || '',
      country: countryLabelMap[work.countryCode || ''] || work.countryCode || '',
      team: teamMembers,
      teamIntro: work.team?.teamIntro || '',
      contactEmail: work.team?.contactEmail || '',
      coverUrl: work.coverUrl || '',
      story: work.detail?.story || '',
      features: features.map((line, index) => `${index + 1}. ${line}`).join('\n'),
      scenarios: scenarios.join('\n'),
      screenshots: work.images.map(image => image.imageUrl),
      techStack: '',
      demoUrl: work.detail?.demoUrl || '',
      repoUrl: work.detail?.repoUrl || '',
      isFeatured: false,
      isTrending: false,
      isCitySelection: false,
      isCommunityRecommended: false,
      createdAt: work.createdAt,
      views: Number(work.statistic?.viewCount || 0),
      likes: Number(work.statistic?.likeCount || 0),
      category: categoryLabelMap[work.categoryCode || ''] || work.categoryCode || '',
      tags: work.tags.map(item => item.tag.name),
      honors: work.honors
        .map(honor => {
          if (honor.dictItem?.itemValue) {
            if (honor.dictItem.labelI18n && typeof honor.dictItem.labelI18n === 'object') {
              const i18n = honor.dictItem.labelI18n as Record<string, string>
              return i18n[lang] || honor.dictItem.itemLabel
            }
            return honor.dictItem.itemLabel
          }
          return ''
        })
        .filter(Boolean),
      author: {
        name: work.user?.username || '',
        avatar: work.user?.avatarUrl || null,
        email: work.user?.email || null,
        bio: work.user?.bio || null
      }
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to fetch work detail:', error)
    return NextResponse.json({ error: 'Failed to fetch work detail' }, { status: 500 })
  }
}
