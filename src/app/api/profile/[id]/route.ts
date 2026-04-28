import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/profile/[id] — 公开用户主页（无需登录）
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await prisma.sysUser.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 只返回已审核且可见的作品
    const works = await prisma.workBase.findMany({
      where: {
        userId: user.id,
        statistic: { auditStatus: 1, displayStatus: 1 },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        summary: true,
        coverUrl: true,
        countryCode: true,
        cityCode: true,
        createdAt: true,
        tags: { select: { tag: { select: { name: true } } } },
        honors: {
          select: {
            dictItem: { select: { itemLabel: true, itemValue: true } },
          },
        },
        statistic: {
          select: { viewCount: true, likeCount: true },
        },
      },
    });

    const totalViews = works.reduce(
      (sum, w) => sum + Number(w.statistic?.viewCount || 0),
      0
    );
    const totalLikes = works.reduce(
      (sum, w) => sum + Number(w.statistic?.likeCount || 0),
      0
    );

    const sanitize = (data: unknown) =>
      JSON.parse(JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)));

    return NextResponse.json(
      sanitize({
        profile: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          workCount: works.length,
          totalViews,
          totalLikes,
          joinedAt: user.createdAt,
        },
        works: works.map((w) => ({
          id: w.id,
          title: w.title,
          summary: w.summary,
          coverUrl: w.coverUrl,
          countryCode: w.countryCode,
          cityCode: w.cityCode,
          createdAt: w.createdAt,
          views: Number(w.statistic?.viewCount || 0),
          likes: Number(w.statistic?.likeCount || 0),
          tags: w.tags.map((t) => t.tag.name),
          honors: w.honors.map((h) => h.dictItem?.itemLabel || ""),
        })),
      })
    );
  } catch (error) {
    console.error("[API] Failed to fetch public profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
