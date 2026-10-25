import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchWorkLikesPage } from '@/lib/work-likes-query';
import { serializeNotifications } from '@/lib/user-notifications';

/**
 * GET /api/works/[id]/likes
 * 公开展示点赞用户（与作品详情相同的可见性规则）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthUser();

    const { id } = await params;
    let workId: bigint;
    try {
      workId = BigInt(id);
    } catch {
      return NextResponse.json({ error: 'Invalid work id' }, { status: 400 });
    }

    const work = await prisma.workBase.findUnique({
      where: { id: workId },
      select: {
        id: true,
        title: true,
        userId: true,
        statistic: { select: { auditStatus: true, displayStatus: true } },
      },
    });
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    const isOwner = currentUser && work.userId === currentUser.userId;
    const isAdminUser = isAdmin(currentUser);
    const isApproved = work.statistic?.auditStatus === 1;
    const isVisible = work.statistic?.displayStatus === 1;

    if (!isOwner && !isAdminUser && (!isApproved || !isVisible)) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10))
    );

    const result = await fetchWorkLikesPage({ workId, page, pageSize });

    return NextResponse.json(
      serializeNotifications({
        ...result,
        workTitle: work.title,
      })
    );
  } catch (error) {
    console.error('[API] GET /api/works/[id]/likes', error);
    return NextResponse.json(
      { error: 'Failed to fetch work likes' },
      { status: 500 }
    );
  }
}
