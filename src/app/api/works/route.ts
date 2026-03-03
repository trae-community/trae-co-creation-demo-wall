import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '12');
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sort = searchParams.get('sort') || 'newest'; // newest, likes, views

    const where: Prisma.WorkBaseWhereInput = {
      // Basic filtering
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(city && { cityCode: city }),
      ...(country && { countryCode: country }),
      ...(category && { categoryCode: category }),
      
      // Tag filtering
      ...(tags && tags.length > 0 && {
        tags: {
          some: {
            tag: {
              name: { in: tags }
            }
          }
        }
      }),

      // Temporarily remove displayStatus and auditStatus checks to show all works
      // statistic: {
      //   displayStatus: 1, // Assuming 1 means published/visible
      //   auditStatus: 1,   // Assuming 1 means approved
      // }
    };

    // Sorting logic
    let orderBy: Prisma.WorkBaseOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'likes') {
      orderBy = { statistic: { likeCount: 'desc' } };
    } else if (sort === 'views') {
      orderBy = { statistic: { viewCount: 'desc' } };
    }

    const [total, works] = await Promise.all([
      prisma.workBase.count({ where }),
      prisma.workBase.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
            }
          },
          statistic: {
            select: {
              viewCount: true,
              likeCount: true,
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          team: {
            select: {
              members: true
            }
          }
        }
      })
    ]);
    console.log(works);
    

    // Transform data to match frontend expectations
    const items = works.map(work => ({
      id: work.id.toString(),
      name: work.title,
      intro: work.summary,
      city: work.cityCode,
      country: work.countryCode,
      category: work.categoryCode,
      coverUrl: work.coverUrl,
      author: {
        name: work.user.username,
        avatar: work.user.avatarUrl,
      },
      team: work.team?.members,
      views: Number(work.statistic?.viewCount || 0),
      likes: Number(work.statistic?.likeCount || 0),
      tags: work.tags.map(r => r.tag.name),
      createdAt: work.createdAt
    }));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('Failed to fetch works:', error);
    return NextResponse.json(
      { error: 'Failed to fetch works' },
      { status: 500 }
    );
  }
}
