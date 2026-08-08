import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { banUser, unbanUser } from '@/lib/ban'
import { writeOperationLog } from '@/lib/audit-log'

/**
 * POST /api/users/[id]/ban
 * 封禁 / 解封用户（仅管理员）
 * 零表结构改动：黑名单存于 sys_dict_item (dict_code = banned_users)
 * Body: { banned: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const operator = await getAuthUser()
    if (!isAdmin(operator)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const banned = Boolean(body.banned)

    let userId: bigint
    try {
      userId = BigInt(id)
    } catch {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const target = await prisma.sysUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        roles: { include: { role: { select: { roleCode: true } } } },
      },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 不允许封禁管理员 / 根用户
    if (banned && target.roles.some(r => r.role.roleCode === 'admin' || r.role.roleCode === 'root')) {
      return NextResponse.json({ error: '不能封禁管理员账号' }, { status: 400 })
    }

    const label = `${target.username} (${target.email})`
    if (banned) {
      await banUser(target.id, label)
    } else {
      await unbanUser(target.id)
    }

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'users',
      action: banned ? 'ban' : 'unban',
      targetType: 'sys_user',
      targetId: target.id,
      payload: { username: target.username, email: target.email },
      request: req,
    })

    return NextResponse.json({ success: true, banned })
  } catch (error) {
    console.error('[API] Failed to ban/unban user:', error)
    return NextResponse.json({ error: 'Failed to ban/unban user' }, { status: 500 })
  }
}
