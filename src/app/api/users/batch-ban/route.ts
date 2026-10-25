import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { banUser, unbanUser } from '@/lib/ban'
import { prisma } from '@/lib/prisma'
import { writeOperationLog } from '@/lib/audit-log'

/**
 * POST /api/users/batch-ban
 * 批量封禁 / 解封（管理员）
 */
export async function POST(req: NextRequest) {
  try {
    const operator = await getAuthUser()
    if (!isAdmin(operator)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const banned = body.banned !== false
    const rawIds = Array.isArray(body.userIds) ? body.userIds : []
    const userIds = [...new Set(rawIds.map((id: unknown) => String(id)).filter(Boolean))]

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'userIds is required' }, { status: 400 })
    }
    if (userIds.length > 100) {
      return NextResponse.json({ error: 'At most 100 users per batch' }, { status: 400 })
    }

    const users = await prisma.sysUser.findMany({
      where: { id: { in: userIds.map((id: string) => BigInt(id)) } },
      select: { id: true, username: true, email: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    for (const target of users) {
      const label = `${target.username} (${target.email})`
      if (banned) {
        await banUser(target.id, label)
      } else {
        await unbanUser(target.id)
      }
    }

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'users',
      action: banned ? 'ban' : 'unban',
      targetType: 'sys_user',
      payload: { batch: true, count: users.length, userIds: users.map(u => u.id.toString()) },
      request: req,
    })

    return NextResponse.json({
      success: true,
      updatedCount: users.length,
    })
  } catch (error) {
    console.error('Batch ban failed:', error)
    return NextResponse.json({ error: 'Batch ban failed' }, { status: 500 })
  }
}
