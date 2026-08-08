import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { writeOperationLog } from "@/lib/audit-log";

/**
 * POST /api/works/[id]/view
 * 记录一次作品浏览，浏览量 +1
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workId = BigInt(id);

    const work = await prisma.workBase.findUnique({
      where: { id: workId },
      select: { id: true },
    });
    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    await prisma.workStatistic.upsert({
      where: { workId },
      update: { viewCount: { increment: 1 } },
      create: {
        workId,
        viewCount: 1,
        likeCount: 0,
      },
    });

    // 记录浏览日志（便于排查刷浏览量；未登录用户 operatorId 为空，仅记录 IP）
    const user = await getAuthUser().catch(() => null);
    await writeOperationLog({
      operatorId: user?.userId ?? null,
      module: 'work',
      action: 'view',
      targetType: 'work',
      targetId: workId,
      request: req,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API] POST /api/works/[id]/view", e);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
