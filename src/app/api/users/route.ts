import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CRUD_QUERY_PARAMS } from '@/lib/crud';

// Helper to sanitize user object (remove sensitive data)
const sanitizeUser = (user: any) => {
  if (!user) return null;
  // Convert BigInt to string
  const serialized = JSON.parse(JSON.stringify(user, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  // Remove passwordHash just in case it was selected
  delete serialized.passwordHash;
  return serialized;
};

// GET: 获取用户列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get(CRUD_QUERY_PARAMS.page) || '1');
    const pageSize = Number(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10');
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || '';
    
    // 构建过滤条件
    const whereFilters: Prisma.SysUserWhereInput[] = [];
    if (query.trim()) {
      whereFilters.push({
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const whereClause = whereFilters.length ? { AND: whereFilters } : undefined;
    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const take = Math.max(pageSize, 1);

    // 查询总数和数据
    const [total, users] = await Promise.all([
      prisma.sysUser.count({ where: whereClause }),
      prisma.sysUser.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          clerkId: true,
          // Explicitly excluding passwordHash by not selecting it
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return NextResponse.json({
      items: users.map(sanitizeUser),
      total,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1)
    });
  } catch (error) {
    console.error('[API] Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: 创建用户
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, phone, bio, avatarUrl } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and Email are required' }, { status: 400 });
    }

    const newUser = await prisma.sysUser.create({
      data: {
        username,
        email,
        phone,
        bio,
        avatarUrl,
        // passwordHash is omitted as per security requirement and lack of secure handling context
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        clerkId: true,
      }
    });

    return NextResponse.json(sanitizeUser(newUser));
  } catch (error) {
    console.error('[API] Failed to create user:', error);
    // Handle unique constraint violations
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Email or Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT: 更新用户
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, email, phone, bio, avatarUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.sysUser.update({
      where: { id: BigInt(id) },
      data: {
        username,
        email,
        phone,
        bio,
        avatarUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        clerkId: true,
      }
    });

    return NextResponse.json(sanitizeUser(updatedUser));
  } catch (error) {
    console.error('[API] Failed to update user:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Email or Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: 删除用户
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.sysUser.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
