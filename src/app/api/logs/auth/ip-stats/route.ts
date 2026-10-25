import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { getSignupStatsByIp } from '@/lib/auth-log-queries'

/**
 * GET /api/logs/auth/ip-stats
 * 同 IP 多次注册统计（控制台风控）
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days') || '7')))
    const minCount = Math.max(2, Number(searchParams.get('minCount') || '3'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))

    const since = new Date()
    since.setDate(since.getDate() - days)

    const items = await getSignupStatsByIp({ since, minCount, limit })

    return NextResponse.json({
      items,
      days,
      minCount,
      since: since.toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch IP signup stats:', error)
    return NextResponse.json({ error: 'Failed to fetch IP stats' }, { status: 500 })
  }
}
