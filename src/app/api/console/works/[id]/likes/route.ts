import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'

/**
 * GET /api/console/works/[id]/likes
 * 查询某作品的点赞用户列表（管理员专用）
 * 支持分页，返回点赞用户信息 + 注册时间，便于排查批量新用户刷点赞
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    let workId: bigint
    try {
      workId = BigInt(id)
    } catch {
      return NextResponse.json({ error: 'Invalid work id' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const skip = (page - 1) * pageSize

    const work = await prisma.workBase.findUnique({
      where: { id: workId },
      select: { id: true, title: true },
    })
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const [total, likes] = await Promise.all([
      prisma.workLike.count({ where: { workId } }),
      prisma.workLike.findMany({
        where: { workId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ])

    const items = likes.map((like) => ({
      id: like.id,
      likedAt: like.createdAt,
      user: like.user,
    }))

    const serialized = JSON.parse(
      JSON.stringify(items, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )

    return NextResponse.json({
      items: serialized,
      total,
      workTitle: work.title,
    })
  } catch (error) {
    console.error('Failed to fetch work likes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work likes' },
      { status: 500 }
    )
  }
}
