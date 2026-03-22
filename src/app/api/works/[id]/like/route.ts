import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/works/[id]/like
 * 切换当前用户对该作品的点赞状态（已赞则取消，未赞则点赞）
 * 需要登录。
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const workId = BigInt(id);

    const work = await prisma.workBase.findUnique({
      where: { id: workId },
      select: { id: true },
    });
    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    const existing = await prisma.workLike.findUnique({
      where: {
        userId_workId: { userId: user.userId, workId },
      },
    });

    if (existing) {
      await prisma.workLike.delete({
        where: {
          userId_workId: { userId: user.userId, workId },
        },
      });
      const stat = await prisma.workStatistic.findUnique({ where: { workId } });
      if (stat) {
        await prisma.workStatistic.update({
          where: { workId },
          data: { likeCount: { decrement: 1 } },
        });
      }
      return NextResponse.json({ liked: false });
    }

    await prisma.$transaction([
      prisma.workLike.create({
        data: { userId: user.userId, workId },
      }),
      prisma.workStatistic.upsert({
        where: { workId },
        update: { likeCount: { increment: 1 } },
        create: { workId, viewCount: 0, likeCount: 1 },
      }),
    ]);

    return NextResponse.json({ liked: true });
  } catch (e) {
    console.error("[API] POST /api/works/[id]/like", e);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
