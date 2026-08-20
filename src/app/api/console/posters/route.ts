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
 * GET /api/console/posters
 * 获取所有海报列表（管理员，含所有审核状态）
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10));
    const auditStatus = searchParams.get('auditStatus');
    const query = searchParams.get('query')?.trim();
    const sort = searchParams.get('sort') || 'newest';
    const date = searchParams.get('date');

    const where: Record<string, unknown> = {};
    if (auditStatus !== null && auditStatus !== '') {
      where.auditStatus = Number(auditStatus);
    }
    if (query) {
      where.OR = [
        { nickname: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    // 按日期筛选（与作品管理一致）
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { gte: start, lte: end };
    }

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };

    const [total, items] = await Promise.all([
      prisma.workPoster.count({ where }),
      prisma.workPoster.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { username: true, email: true, avatarUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({
      items: sanitize(items),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[API] Failed to fetch console posters:', error);
    return NextResponse.json({ error: '获取海报列表失败' }, { status: 500 });
  }
}
