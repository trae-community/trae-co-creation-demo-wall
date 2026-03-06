import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrSyncUser } from '@/lib/auth'
import { z } from 'zod'

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

const updateSchema = z.object({
  name: z.string().min(2).max(50),
  intro: z.string().min(10).max(100),
  country: z.string().min(1),
  city: z.string().min(1),
  team: z.string().min(2),
  teamIntro: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  coverUrl: z.string().min(1),
  story: z.string().min(20),
  category: z.string().min(1),
  devStatus: z.string().min(1),
  tags: z.array(z.number()).min(1).max(5),
  highlights: z.array(z.string().max(10)).min(3).max(5),
  scenarios: z.array(z.string()).min(1),
  screenshots: z.array(z.string()).min(1).max(5),
  demoUrl: z.string().url(),
  repoUrl: z.string().url().optional().or(z.literal('')),
})

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrSyncUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const validationResult = updateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const workId = BigInt(id)

    // Verify ownership
    const existingWork = await prisma.workBase.findUnique({
      where: { id: workId },
      select: { userId: true }
    })

    if (!existingWork) {
      return NextResponse.json(
        { success: false, error: 'Work not found' },
        { status: 404 }
      )
    }

    if (existingWork.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update database using transaction
    await prisma.$transaction(async (tx) => {
      await tx.workBase.update({
        where: { id: workId },
        data: {
          title: data.name,
          summary: data.intro,
          cityCode: data.city,
          countryCode: data.country,
          coverUrl: data.coverUrl,
          categoryCode: data.category,
          devStatusCode: data.devStatus,
          updatedAt: new Date(),
        },
      })

      await tx.workTagRelation.deleteMany({ where: { workId } })
      if (data.tags.length > 0) {
        await tx.workTagRelation.createMany({
          data: data.tags.map(tagId => ({ workId, tagId }))
        })
      }

      await tx.workDetail.upsert({
        where: { workId },
        create: {
          workId,
          story: data.story,
          highlights: data.highlights,
          scenarios: data.scenarios,
          demoUrl: data.demoUrl,
          repoUrl: data.repoUrl || null,
        },
        update: {
          story: data.story,
          highlights: data.highlights,
          scenarios: data.scenarios,
          demoUrl: data.demoUrl,
          repoUrl: data.repoUrl || null,
        },
      })

      await tx.workImage.deleteMany({
        where: { workId, imageType: 'screenshot' }
      })
      if (data.screenshots.length > 0) {
        await tx.workImage.createMany({
          data: data.screenshots.map((url, index) => ({
            workId,
            imageUrl: url,
            imageType: 'screenshot',
            sortOrder: index,
          })),
        })
      }

      await tx.workTeam.upsert({
        where: { workId },
        create: {
          workId,
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
        update: {
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
