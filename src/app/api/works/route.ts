import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '12'));
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const lang = searchParams.get('lang') || 'zh-CN';
    const sort = searchParams.get('sort') || 'newest'; // newest, likes, views

    const cityCodes = city?.split(',').filter(Boolean) || [];
    const countryCodes = country?.split(',').filter(Boolean) || [];
    const categoryCodes = category?.split(',').filter(Boolean) || [];

    // 构建过滤条件
    const whereFilters: Prisma.WorkBaseWhereInput[] = [
      {
        statistic: {
          auditStatus: 1,
          displayStatus: 1
        }
      }
    ];

    if (search) {
      whereFilters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (cityCodes.length > 0) {
      whereFilters.push({ cityCode: { in: cityCodes } });
    }
    if (countryCodes.length > 0) {
      whereFilters.push({ countryCode: { in: countryCodes } });
    }
    if (categoryCodes.length > 0) {
      whereFilters.push({ categoryCode: { in: categoryCodes } });
    }

    if (tags && tags.length > 0) {
      whereFilters.push({
        tags: {
          some: {
            tag: {
              name: { in: tags }
            }
          }
        }
      });
    }

    const where: Prisma.WorkBaseWhereInput = { AND: whereFilters };

    // Sorting logic
    let orderBy: Prisma.WorkBaseOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'likes') {
      orderBy = { statistic: { likeCount: 'desc' } };
    } else if (sort === 'views') {
      orderBy = { statistic: { viewCount: 'desc' } };
    }

    const [countryDict, cityDict, categoryDict, honorDict] = await Promise.all([
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
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'honor_type' },
        include: { items: true }
      })
    ]);

    const resolveLabelMap = (items: Array<{ itemValue: string; itemLabel: string; labelI18n: Prisma.JsonValue | null }>) => {
      return items.reduce<Record<string, string>>((acc, item) => {
        let label = item.itemLabel;
        if (item.labelI18n && typeof item.labelI18n === 'object') {
          const i18n = item.labelI18n as Record<string, string>;
          if (i18n[lang]) {
            label = i18n[lang];
          }
        }
        acc[item.itemValue] = label;
        return acc;
      }, {});
    };

    const countryLabelMap = resolveLabelMap(countryDict?.items || []);
    const cityLabelMap = resolveLabelMap(cityDict?.items || []);
    const categoryLabelMap = resolveLabelMap(categoryDict?.items || []);
    const honorLabelMap = resolveLabelMap(honorDict?.items || []);

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
          honors: {
            include: {
              dictItem: true
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

    // Transform data to match frontend expectations
    const items = works.map(work => ({
      id: work.id.toString(),
      name: work.title,
      intro: work.summary,
      city: cityLabelMap[work.cityCode || ''] || work.cityCode || '',
      country: countryLabelMap[work.countryCode || ''] || work.countryCode || '',
      category: categoryLabelMap[work.categoryCode || ''] || work.categoryCode || '',
      coverUrl: work.coverUrl,
      author: {
        name: work.user.username,
        avatar: work.user.avatarUrl,
      },
      team: work.team?.members,
      views: Number(work.statistic?.viewCount || 0),
      likes: Number(work.statistic?.likeCount || 0),
      tags: work.tags.map(r => r.tag.name),
      honors: work.honors
        .map((honor) => {
          if (honor.dictItem?.itemValue) {
            return honorLabelMap[honor.dictItem.itemValue] || honor.dictItem.itemLabel || '';
          }
          return '';
        })
        .filter(Boolean),
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
