import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CRUD_QUERY_PARAMS } from '@/lib/crud';
import { getAuthUser, isAdmin } from '@/lib/auth';

// 系统内置角色：固定三个（root/admin/common），不支持新增/修改/删除
const LOCKED_MESSAGE = '系统角色已固定，不支持新增、修改或删除操作';

// Helper to sanitize object
const sanitize = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// GET: 获取角色列表
export async function GET(req: NextRequest) {
  try {
    // 鉴权检查：只有管理员可以访问
    const user = await getAuthUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get(CRUD_QUERY_PARAMS.page) || '1');
    const pageSize = Number(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10');
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || '';
    
    // 构建过滤条件
    const whereFilters: Prisma.SysRoleWhereInput[] = [];
    if (query.trim()) {
      whereFilters.push({
        OR: [
          { roleName: { contains: query, mode: 'insensitive' } },
          { roleCode: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const whereClause = whereFilters.length ? { AND: whereFilters } : undefined;
    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const take = Math.max(pageSize, 1);

    // 查询总数和数据
    const [total, roles] = await Promise.all([
      prisma.sysRole.count({ where: whereClause }),
      prisma.sysRole.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        skip,
        take
      })
    ]);

    return NextResponse.json({
      items: sanitize(roles),
      total,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1)
    });
  } catch (error) {
    console.error('[API] Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST: 创建角色（已禁用：角色固定为 root/admin/common）
export async function POST(req: NextRequest) {
  const operator = await getAuthUser();
  if (!isAdmin(operator)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 403 });
}

// PUT: 更新角色（已禁用：角色固定为 root/admin/common）
export async function PUT(req: NextRequest) {
  const operator = await getAuthUser();
  if (!isAdmin(operator)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 403 });
}

// DELETE: 删除角色（已禁用：角色固定为 root/admin/common）
export async function DELETE(req: NextRequest) {
  const operator = await getAuthUser();
  if (!isAdmin(operator)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 403 });
}
