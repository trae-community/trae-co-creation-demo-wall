import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

// Helper to sanitize BigInt
const sanitize = (data: unknown) => {
  return JSON.parse(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * GET /api/posters/[id]
 * 获取单个海报详情（公开访问，仅限已审核通过的）
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = BigInt(idStr);
    const user = await getAuthUser();
    const adminMode = isAdmin(user);

    const poster = await prisma.workPoster.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        nickname: true,
        description: true,
        imageUrl: true,
        demoUrl: true,
        auditStatus: true,
        createdAt: true,
      },
    });

    if (!poster) {
      return NextResponse.json({ error: 'Poster not found' }, { status: 404 });
    }

    // 未通过审核的海报仅管理员或创建者可见
    if (poster.auditStatus !== 1 && !adminMode && (!user || poster.userId !== user.userId)) {
      return NextResponse.json({ error: 'Poster not found' }, { status: 404 });
    }

    return NextResponse.json(sanitize(poster));
  } catch {
    return NextResponse.json({ error: 'Invalid poster ID' }, { status: 400 });
  }
}

/**
 * DELETE /api/posters/[id]
 * 删除海报（管理员可删任意海报，本人可删自己的海报）
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = BigInt(idStr);

    // 非管理员需校验归属
    if (!isAdmin(user)) {
      const poster = await prisma.workPoster.findUnique({ where: { id }, select: { userId: true } });
      if (!poster || poster.userId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.workPoster.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete poster' }, { status: 500 });
  }
}

/**
 * PATCH /api/posters/[id]
 * 更新海报审核状态（仅管理员）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = BigInt(idStr);
    const body = await req.json();
    const { auditStatus } = body;

    if (typeof auditStatus !== 'number' || ![0, 1, 2].includes(auditStatus)) {
      return NextResponse.json({ error: 'Invalid audit status' }, { status: 400 });
    }

    const updated = await prisma.workPoster.update({
      where: { id },
      data: { auditStatus },
    });

    return NextResponse.json(sanitize(updated));
  } catch {
    return NextResponse.json({ error: 'Failed to update poster' }, { status: 500 });
  }
}
