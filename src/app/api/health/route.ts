import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health
 * 部署与负载均衡探活：进程可响应且数据库可连接。
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: 'up',
      timestamp,
    });
  } catch (error) {
    console.error('[API] GET /api/health database check failed', error);
    return NextResponse.json(
      {
        ok: false,
        db: 'down',
        timestamp,
      },
      { status: 503 }
    );
  }
}
