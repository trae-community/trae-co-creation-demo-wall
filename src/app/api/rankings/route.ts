import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ── 1. 城市排行 Top20 ──
    const cityDictItems = await prisma.sysDictItem.findMany({
      where: { dictCode: "city", status: true },
      orderBy: { sortOrder: "asc" },
    });

    const countryDictItems = await prisma.sysDictItem.findMany({
      where: { dictCode: "country", status: true },
    });
    const countryMap = new Map(countryDictItems.map((c) => [c.itemValue, { name: c.itemLabel, nameI18n: (c.labelI18n as Record<string, string>) || {} }]));

    // Only approved & displayed works
    const approvedWorks = await prisma.workBase.findMany({
      where: {
        statistic: { auditStatus: 1, displayStatus: 1 },
      },
      include: { statistic: true, user: true },
    });

    const cityStatsMap = new Map<string, { approvedCount: number; totalViews: number; totalLikes: number }>();
    for (const w of approvedWorks) {
      if (!w.cityCode) continue;
      const existing = cityStatsMap.get(w.cityCode) || { approvedCount: 0, totalViews: 0, totalLikes: 0 };
      existing.approvedCount += 1;
      existing.totalViews += Number(w.statistic?.viewCount || 0);
      existing.totalLikes += Number(w.statistic?.likeCount || 0);
      cityStatsMap.set(w.cityCode, existing);
    }

    const cityRanking = cityDictItems
      .filter((city) => {
        const stats = cityStatsMap.get(city.itemValue);
        return stats && stats.approvedCount > 0;
      })
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

    // ── 2. 作品排行 Top10 ──
    const topWorksByViews = await prisma.workBase.findMany({
      where: {
        statistic: { auditStatus: 1, displayStatus: 1 },
      },
      include: { statistic: true, user: true },
      orderBy: { statistic: { viewCount: "desc" } },
      take: 10,
    });

    const topWorksByLikes = await prisma.workBase.findMany({
      where: {
        statistic: { auditStatus: 1, displayStatus: 1 },
      },
      include: { statistic: true, user: true },
      orderBy: { statistic: { likeCount: "desc" } },
      take: 10,
    });

    const serializeWork = (w: typeof topWorksByViews[number]) => ({
      id: w.id.toString(),
      title: w.title,
      coverUrl: w.coverUrl,
      summary: w.summary,
      author: {
        id: w.user.id.toString(),
        name: w.user.username,
      },
      views: Number(w.statistic?.viewCount || 0),
      likes: Number(w.statistic?.likeCount || 0),
    });

    // ── 3. 创作者排行 Top10 ──
    // Aggregate by userId
    const userAgg = new Map<string, { username: string; avatarUrl: string | null; workCount: number; totalViews: number; totalLikes: number }>();
    for (const w of approvedWorks) {
      const uid = w.userId.toString();
      const existing = userAgg.get(uid) || { username: w.user.username, avatarUrl: w.user.avatarUrl, workCount: 0, totalViews: 0, totalLikes: 0 };
      existing.workCount += 1;
      existing.totalViews += Number(w.statistic?.viewCount || 0);
      existing.totalLikes += Number(w.statistic?.likeCount || 0);
      userAgg.set(uid, existing);
    }

    const allCreators = Array.from(userAgg.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));

    const topCreatorsByWorks = [...allCreators].sort((a, b) => b.workCount - a.workCount).slice(0, 10);
    const topCreatorsByViews = [...allCreators].sort((a, b) => b.totalViews - a.totalViews).slice(0, 10);
    const topCreatorsByLikes = [...allCreators].sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 10);

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
    });
  } catch (error) {
    console.error("[API] Failed to fetch rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
