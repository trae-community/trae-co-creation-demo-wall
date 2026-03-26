import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取所有城市字典项
    const cityDictItems = await prisma.sysDictItem.findMany({
      where: { dictCode: "city", status: true },
      orderBy: { sortOrder: "asc" },
    });

    // 获取所有作品及其统计数据
    const works = await prisma.workBase.findMany({
      include: {
        statistic: true,
      },
    });

    // 按城市统计
    const cityStats = cityDictItems.map((city) => {
      const cityWorks = works.filter((w) => w.cityCode === city.itemValue);
      const approvedWorks = cityWorks.filter(
        (w) => w.statistic?.auditStatus === 1
      );

      const totalWorks = cityWorks.length;
      const approvedCount = approvedWorks.length;
      const totalViews = approvedWorks.reduce(
        (sum, w) => sum + Number(w.statistic?.viewCount || 0),
        0
      );
      const totalLikes = approvedWorks.reduce(
        (sum, w) => sum + Number(w.statistic?.likeCount || 0),
        0
      );

      return {
        id: city.id.toString(),
        code: city.itemValue,
        name: city.itemLabel,
        nameI18n: (city.labelI18n as Record<string, string>) || {},
        parentValue: city.parentValue,
        totalWorks,
        approvedCount,
        pendingCount: totalWorks - approvedCount,
        totalViews,
        totalLikes,
      };
    });

    // 排序：有作品的城市优先，然后按作品数、浏览量排序
    cityStats.sort((a, b) => {
      if (b.approvedCount !== a.approvedCount) {
        return b.approvedCount - a.approvedCount;
      }
      if (b.totalViews !== a.totalViews) {
        return b.totalViews - a.totalViews;
      }
      return b.totalLikes - a.totalLikes;
    });

    return NextResponse.json({
      items: cityStats,
      total: cityStats.length,
    });
  } catch (error) {
    console.error("[API] Failed to fetch city stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch city stats" },
      { status: 500 }
    );
  }
}
