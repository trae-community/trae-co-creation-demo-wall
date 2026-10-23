import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { writeOperationLog } from '@/lib/audit-log';

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

/**
 * PUT /api/console/posters
 * 管理员更新海报审核状态（支持单条 id 或批量 ids）
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ids, auditStatus } = body;

    if (auditStatus === undefined || ![0, 1, 2].includes(Number(auditStatus))) {
      return NextResponse.json({ error: '审核状态无效，可选值：0(待审)/1(通过)/2(拒绝)' }, { status: 400 });
    }

    const batchIds = Array.isArray(ids)
      ? [...new Set(ids.map((value: unknown) => String(value)).filter(Boolean))]
      : [];
    const targetIds = batchIds.length > 0 ? batchIds : id ? [String(id)] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Poster ID is required' }, { status: 400 });
    }

    const posterIds = targetIds.map((value: string) => BigInt(value));
    const newStatus = Number(auditStatus);

    const existing = await prisma.workPoster.findMany({
      where: { id: { in: posterIds } },
      select: { id: true },
    });

    if (existing.length !== posterIds.length) {
      return NextResponse.json({ error: 'Some posters were not found' }, { status: 404 });
    }

    await prisma.workPoster.updateMany({
      where: { id: { in: posterIds } },
      data: { auditStatus: newStatus },
    });

    const isBatch = targetIds.length > 1;
    await Promise.all(
      targetIds.map((targetId) =>
        writeOperationLog({
          operatorId: user.userId,
          module: 'poster',
          action: 'audit',
          targetType: 'work_poster',
          targetId,
          payload: { auditStatus: newStatus, batch: isBatch },
          request: req,
        })
      )
    );

    return NextResponse.json({
      success: true,
      updatedCount: targetIds.length,
    });
  } catch (error) {
    console.error('[API] Failed to batch audit posters:', error);
    return NextResponse.json({ error: '更新审核状态失败' }, { status: 500 });
  }
}
