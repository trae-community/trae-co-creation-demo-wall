import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/works/likes
 * 获取当前用户点赞的作品列表
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '12'));

    const [total, likes] = await Promise.all([
      prisma.workLike.count({
        where: { userId: user.userId },
      }),
      prisma.workLike.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          work: {
            include: {
              user: {
                select: {
                  username: true,
                  avatarUrl: true,
                },
              },
              statistic: {
                select: {
                  viewCount: true,
                  likeCount: true,
                },
              },
              tags: {
                include: {
                  tag: true,
                },
              },
              team: {
                select: {
                  members: true,
                },
              },
              honors: {
                include: {
                  dictItem: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Transform data
    const items = likes.map((like) => {
      const work = like.work;
      return {
        id: work.id.toString(),
        name: work.title,
        intro: work.summary,
        city: work.cityCode || '',
        country: work.countryCode || '',
        category: work.categoryCode || '',
        coverUrl: work.coverUrl,
        author: {
          name: work.user.username,
          avatar: work.user.avatarUrl,
        },
        team: work.team?.members,
        views: Number(work.statistic?.viewCount || 0),
        likes: Number(work.statistic?.likeCount || 0),
        tags: work.tags.map((r) => r.tag.name),
        honors: work.honors
          .map((honor) => honor.dictItem?.itemLabel || '')
          .filter(Boolean),
        createdAt: work.createdAt,
        likedAt: like.createdAt,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[API] GET /api/works/likes', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked works' },
      { status: 500 }
    );
  }
}
