import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean)
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

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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
            avatarUrl: true
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

    const features = toStringArray(work.detail?.highlights)
    const scenarios = toStringArray(work.detail?.scenarios)

    const item = {
      id: work.id.toString(),
      name: work.title || '',
      intro: work.summary || '',
      city: work.cityCode || '',
      country: work.countryCode || '',
      team: work.team?.members ?? null,
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
      category: work.categoryCode || '',
      tags: work.tags.map(item => item.tag.name),
      author: {
        name: work.user?.username || '',
        avatar: work.user?.avatarUrl || null
      }
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to fetch work detail:', error)
    return NextResponse.json({ error: 'Failed to fetch work detail' }, { status: 500 })
  }
}
