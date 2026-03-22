import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/works/[id]/stats
 * 获取作品浏览量、点赞数及当前用户是否已点赞
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workId = BigInt(id);

    const [stat, user] = await Promise.all([
      prisma.workStatistic.findUnique({
        where: { workId },
        select: { viewCount: true, likeCount: true },
      }),
      getAuthUser(),
    ]);

    const viewCount = Number(stat?.viewCount ?? 0);
    const likeCount = Number(stat?.likeCount ?? 0);

    let liked = false;
    if (user) {
      const like = await prisma.workLike.findUnique({
        where: {
          userId_workId: { userId: user.userId, workId },
        },
      });
      liked = !!like;
    }

    return NextResponse.json({
      viewCount,
      likeCount,
      liked,
    });
  } catch (e) {
    console.error("[API] GET /api/works/[id]/stats", e);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
