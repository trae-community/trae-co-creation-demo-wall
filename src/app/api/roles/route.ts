import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CRUD_QUERY_PARAMS } from '@/lib/crud';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { writeOperationLog } from '@/lib/audit-log';

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

// POST: 创建角色
export async function POST(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    if (!isAdmin(operator)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const body = await req.json();
    const { roleCode, roleName, description } = body;

    if (!roleCode || !roleName) {
      return NextResponse.json({ error: 'Role Code and Role Name are required' }, { status: 400 });
    }

    const newRole = await prisma.sysRole.create({
      data: {
        roleCode,
        roleName,
        description,
      }
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'roles',
      action: 'create',
      targetType: 'sys_role',
      targetId: newRole.id,
      payload: { roleCode, roleName },
      request: req
    });

    return NextResponse.json(sanitize(newRole));
  } catch (error) {
    console.error('[API] Failed to create role:', error);
    await writeOperationLog({
      module: 'roles',
      action: 'create',
      targetType: 'sys_role',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Role Code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

// PUT: 更新角色
export async function PUT(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    if (!isAdmin(operator)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const body = await req.json();
    const { id, roleCode, roleName, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const updatedRole = await prisma.sysRole.update({
      where: { id: Number(id) },
      data: {
        roleCode,
        roleName,
        description,
      }
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'roles',
      action: 'update',
      targetType: 'sys_role',
      targetId: updatedRole.id,
      payload: { id, roleCode, roleName },
      request: req
    });

    return NextResponse.json(sanitize(updatedRole));
  } catch (error) {
    console.error('[API] Failed to update role:', error);
    await writeOperationLog({
      module: 'roles',
      action: 'update',
      targetType: 'sys_role',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Role Code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE: 删除角色
export async function DELETE(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    if (!isAdmin(operator)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    await prisma.sysRole.delete({
      where: { id: Number(id) },
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'roles',
      action: 'delete',
      targetType: 'sys_role',
      targetId: id,
      request: req
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete role:', error);
    await writeOperationLog({
      module: 'roles',
      action: 'delete',
      targetType: 'sys_role',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
