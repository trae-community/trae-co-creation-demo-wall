import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications/unread-count
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.sysUserNotification.count({
      where: { userId: user.userId, readAt: null },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[API] GET /api/notifications/unread-count', error);
    return NextResponse.json({ count: 0 });
  }
}
