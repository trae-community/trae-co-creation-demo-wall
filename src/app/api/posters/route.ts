import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { writeOperationLog } from '@/lib/audit-log';

// Helper to sanitize BigInt
const sanitize = (data: unknown) => {
  return JSON.parse(JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * GET /api/posters
 * 默认：获取已通过审核的海报列表（公开访问）
 * mine=1：获取当前用户自己的全部海报（含待审/拒绝，需登录）
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 12));
    const sort = searchParams.get('sort') || 'newest';
    const mine = searchParams.get('mine') === '1';

    let where: Prisma.WorkPosterWhereInput;
    if (mine) {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      where = { userId: user.userId };
    } else {
      where = { auditStatus: 1 }; // 橱窗仅展示已通过的
    }

    const orderBy: Prisma.WorkPosterOrderByWithRelationInput =
      sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      prisma.workPoster.count({ where }),
      prisma.workPoster.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nickname: true,
          description: true,
          imageUrl: true,
          demoUrl: true,
          tags: true,
          createdAt: true,
          ...(mine ? { auditStatus: true } : {}),
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
    console.error('[API] Failed to fetch posters:', error);
    return NextResponse.json({ error: 'Failed to fetch posters' }, { status: 500 });
  }
}

/**
 * POST /api/posters
 * 创建海报（需登录）
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { nickname, description, imageUrl, demoUrl, tagIds } = body;

    // 验证必填字段
    if (!nickname || !imageUrl || !demoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: nickname, imageUrl, demoUrl' },
        { status: 400 }
      );
    }

    // 验证 URL 格式
    try {
      new URL(demoUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid demo URL' }, { status: 400 });
    }

    // 标签验证：必须选择标签；含有效自动过审标签时免审核
    // （与作品提交 /api/submit 的自动过审校验逻辑保持一致）
    const ids: number[] = Array.isArray(tagIds) ? tagIds.map(Number).filter(n => Number.isInteger(n) && n > 0) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Please select at least one tag' }, { status: 400 });
    }

    const now = new Date();
    const [selectedTags, autoAuditTags] = await Promise.all([
      prisma.workTag.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      prisma.workTag.findMany({
        where: {
          id: { in: ids },
          isAutoAudit: true,
          OR: [{ auditStartTime: null }, { auditStartTime: { lte: now } }],
          AND: [{ OR: [{ auditEndTime: null }, { auditEndTime: { gte: now } }] }]
        },
        select: { id: true }
      })
    ]);

    if (selectedTags.length === 0) {
      return NextResponse.json({ error: 'Invalid tag selection' }, { status: 400 });
    }

    const isAutoApproved = autoAuditTags.length > 0;
    const auditStatus = isAutoApproved ? 1 : 0;
    const tagNames = selectedTags.map(t => t.name);

    const poster = await prisma.workPoster.create({
      data: {
        userId: user.userId,
        nickname: String(nickname).slice(0, 100),
        description: description ? String(description).slice(0, 500) : null,
        imageUrl: String(imageUrl).slice(0, 255),
        demoUrl: String(demoUrl).slice(0, 255),
        auditStatus,
        tags: tagNames as unknown as Prisma.InputJsonValue,
      },
    });

    await writeOperationLog({
      operatorId: user.userId,
      module: 'poster',
      action: 'create',
      targetType: 'work_poster',
      targetId: poster.id,
      payload: { nickname: String(nickname).slice(0, 100), tags: tagNames, autoApproved: isAutoApproved },
      request: req,
    });

    return NextResponse.json({ ...sanitize(poster), autoApproved: isAutoApproved }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create poster:', error);
    await writeOperationLog({
      module: 'poster',
      action: 'create',
      targetType: 'work_poster',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req,
    });
    return NextResponse.json({ error: 'Failed to create poster' }, { status: 500 });
  }
}
