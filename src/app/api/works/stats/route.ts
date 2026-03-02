import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/works/stats?ids=1,2,3
 * 批量获取多个作品的浏览量、点赞数
 */
export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json(
        { error: "Missing ids query (e.g. ?ids=1,2,3)" },
        { status: 400 }
      );
    }
    const workIds = ids.split(",").map((s) => BigInt(s.trim())).filter(BigInt);

    const stats = await prisma.workStatistic.findMany({
      where: { workId: { in: workIds } },
      select: { workId: true, viewCount: true, likeCount: true },
    });

    const map: Record<string, { viewCount: number; likeCount: number }> = {};
    for (const s of stats) {
      map[s.workId.toString()] = {
        viewCount: Number(s.viewCount ?? 0),
        likeCount: Number(s.likeCount ?? 0),
      };
    }
    for (const wid of workIds) {
      const key = wid.toString();
      if (!(key in map)) map[key] = { viewCount: 0, likeCount: 0 };
    }

    return NextResponse.json(map);
  } catch (e) {
    console.error("[API] GET /api/works/stats", e);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
