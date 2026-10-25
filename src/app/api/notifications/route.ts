import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeNotifications } from '@/lib/user-notifications';

/**
 * GET /api/notifications
 * 当前用户的站内通知列表（分页）
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
    );
    const unreadOnly = searchParams.get('unreadOnly') === '1';
    const skip = (page - 1) * pageSize;

    const where = {
      userId: user.userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.sysUserNotification.count({ where }),
      prisma.sysUserNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json(
      serializeNotifications({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    console.error('[API] GET /api/notifications', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * 标记已读：{ id } 单条 | { all: true } 全部
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();

    if (body.all === true) {
      const result = await prisma.sysUserNotification.updateMany({
        where: { userId: user.userId, readAt: null },
        data: { readAt: now },
      });
      return NextResponse.json({ success: true, updatedCount: result.count });
    }

    const id = body.id != null ? String(body.id) : '';
    if (!id) {
      return NextResponse.json({ error: 'id or all is required' }, { status: 400 });
    }

    let notificationId: bigint;
    try {
      notificationId = BigInt(id);
    } catch {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const existing = await prisma.sysUserNotification.findFirst({
      where: { id: notificationId, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.sysUserNotification.update({
      where: { id: notificationId },
      data: { readAt: existing.readAt ?? now },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] PATCH /api/notifications', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
