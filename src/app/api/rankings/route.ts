import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCityRankingAggregates,
  getCreatorRankingAggregates,
} from '@/lib/rankings-queries';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      cityDictItems,
      countryDictItems,
      cityAggs,
      creatorAggs,
      topWorksByViews,
      topWorksByLikes,
      trendingWorks,
    ] = await Promise.all([
      prisma.sysDictItem.findMany({
        where: { dictCode: 'city', status: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.sysDictItem.findMany({
        where: { dictCode: 'country', status: true },
      }),
      getCityRankingAggregates(),
      getCreatorRankingAggregates(),
      prisma.workBase.findMany({
        where: {
          statistic: { auditStatus: 1, displayStatus: 1 },
        },
        include: { statistic: true, user: true },
        orderBy: { statistic: { viewCount: 'desc' } },
        take: 20,
      }),
      prisma.workBase.findMany({
        where: {
          statistic: { auditStatus: 1, displayStatus: 1 },
        },
        include: { statistic: true, user: true },
        orderBy: { statistic: { likeCount: 'desc' } },
        take: 20,
      }),
      prisma.workBase.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          statistic: { auditStatus: 1, displayStatus: 1 },
        },
        include: { statistic: true, user: true },
        orderBy: { statistic: { viewCount: 'desc' } },
        take: 20,
      }),
    ]);

    const countryMap = new Map(
      countryDictItems.map((c) => [
        c.itemValue,
        { name: c.itemLabel, nameI18n: (c.labelI18n as Record<string, string>) || {} },
      ])
    );

    const cityStatsMap = new Map(cityAggs.map((row) => [row.cityCode, row]));

    const cityRanking = cityDictItems
      .filter((city) => cityStatsMap.has(city.itemValue))
      .map((city) => {
        const stats = cityStatsMap.get(city.itemValue)!;
        const province = city.parentValue ? countryMap.get(city.parentValue) : null;
        return {
          code: city.itemValue,
          name: city.itemLabel,
          nameI18n: (city.labelI18n as Record<string, string>) || {},
          province: province ? { name: province.name, nameI18n: province.nameI18n } : null,
          approvedCount: stats.approvedCount,
          totalViews: stats.totalViews,
          totalLikes: stats.totalLikes,
        };
      })
      .sort((a, b) => {
        if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount;
        if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
        return b.totalLikes - a.totalLikes;
      })
      .slice(0, 20);

    const serializeWork = (w: (typeof topWorksByViews)[number]) => ({
      id: w.id.toString(),
      title: w.title,
      coverUrl: w.coverUrl,
      summary: w.summary,
      createdAt: w.createdAt?.toISOString() || null,
      author: {
        id: w.user.id.toString(),
        name: w.user.username,
        avatarUrl: w.user.avatarUrl,
      },
      views: Number(w.statistic?.viewCount || 0),
      likes: Number(w.statistic?.likeCount || 0),
    });

    const topCreatorsByWorks = [...creatorAggs]
      .sort((a, b) => b.workCount - a.workCount)
      .slice(0, 20);
    const topCreatorsByViews = [...creatorAggs]
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 20);
    const topCreatorsByLikes = [...creatorAggs]
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 20);

    return NextResponse.json({
      cityRanking,
      worksRanking: {
        byViews: topWorksByViews.map(serializeWork),
        byLikes: topWorksByLikes.map(serializeWork),
      },
      creatorsRanking: {
        byWorks: topCreatorsByWorks,
        byViews: topCreatorsByViews,
        byLikes: topCreatorsByLikes,
      },
      trendingWorks: trendingWorks.map(serializeWork),
    });
  } catch (error) {
    console.error('[API] Failed to fetch rankings:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
