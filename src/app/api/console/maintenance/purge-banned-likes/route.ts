import { NextResponse } from 'next/server'
import { getAuthUser, isRoot } from '@/lib/auth'
import { writeOperationLog } from '@/lib/audit-log'
import {
  previewPurgeBannedUserLikes,
  purgeBannedUserLikes,
} from '@/lib/work-like-maintenance'

/** GET — 预览将剔除的点赞数量（仅 root） */
export async function GET() {
  const user = await getAuthUser()
  if (!user || !isRoot(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const preview = await previewPurgeBannedUserLikes()
    return NextResponse.json(preview)
  } catch (error) {
    console.error('[API] purge-banned-likes preview:', error)
    return NextResponse.json({ error: '预览失败' }, { status: 500 })
  }
}

/** POST — 执行剔除并重算 like_count（仅 root） */
export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user || !isRoot(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await purgeBannedUserLikes()

    await writeOperationLog({
      operatorId: user.userId,
      module: 'works',
      action: 'purge_banned_likes',
      targetType: 'work_like',
      targetId: null,
      request: req,
      payload: result,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[API] purge-banned-likes:', error)
    return NextResponse.json({ error: '剔除失败' }, { status: 500 })
  }
}
