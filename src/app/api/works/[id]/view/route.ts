import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/works/[id]/view
 * 记录一次作品浏览，浏览量 +1
 */
export async function POST(
  _req: Request,
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API] POST /api/works/[id]/view", e);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
