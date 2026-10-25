import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type LastSignInInfo = { ip: string | null; at: Date }

/** 批量查询用户最近一次成功登录（PostgreSQL DISTINCT ON） */
export async function getLastSignInsByUserIds(
  userIds: bigint[]
): Promise<Map<string, LastSignInInfo>> {
  const map = new Map<string, LastSignInInfo>()
  if (userIds.length === 0) return map

  const rows = await prisma.$queryRaw<
    Array<{ user_id: bigint; ip_address: string | null; created_at: Date }>
  >`
    SELECT DISTINCT ON (user_id) user_id, ip_address, created_at
    FROM sys_auth_log
    WHERE user_id IN (${Prisma.join(userIds)})
      AND auth_type = 'sign_in'
      AND auth_status = 'success'
    ORDER BY user_id, created_at DESC
  `

  for (const row of rows) {
    map.set(row.user_id.toString(), {
      ip: row.ip_address,
      at: row.created_at,
    })
  }
  return map
}

export type IpSignupStat = {
  ipAddress: string
  signupCount: number
  lastSignupAt: string
  userIds: string[]
  usernames: string[]
}

/** 按 IP 聚合注册成功次数（用于风控列表） */
export async function getSignupStatsByIp(options: {
  since: Date
  minCount: number
  limit: number
}): Promise<IpSignupStat[]> {
  const { since, minCount, limit } = options

  const grouped = await prisma.$queryRaw<
    Array<{ ip_address: string; signup_count: bigint; last_signup_at: Date }>
  >`
    SELECT ip_address, COUNT(*)::bigint AS signup_count, MAX(created_at) AS last_signup_at
    FROM sys_auth_log
    WHERE auth_type = 'sign_up'
      AND auth_status = 'success'
      AND ip_address IS NOT NULL
      AND ip_address <> ''
      AND created_at >= ${since}
    GROUP BY ip_address
    HAVING COUNT(*) >= ${minCount}
    ORDER BY signup_count DESC, last_signup_at DESC
    LIMIT ${limit}
  `

  if (grouped.length === 0) return []

  const ips = grouped.map(g => g.ip_address)
  const recentLogs = await prisma.sysAuthLog.findMany({
    where: {
      authType: 'sign_up',
      authStatus: 'success',
      ipAddress: { in: ips },
      createdAt: { gte: since },
      userId: { not: null },
    },
    select: {
      ipAddress: true,
      userId: true,
      user: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const usersByIp = new Map<string, { ids: string[]; names: string[] }>()
  for (const log of recentLogs) {
    const ip = log.ipAddress
    const uid = log.userId?.toString()
    if (!ip || !uid) continue
    const bucket = usersByIp.get(ip) ?? { ids: [], names: [] }
    if (!bucket.ids.includes(uid)) {
      bucket.ids.push(uid)
      bucket.names.push(log.user?.username ?? uid)
    }
    usersByIp.set(ip, bucket)
  }

  return grouped.map(g => {
    const bucket = usersByIp.get(g.ip_address) ?? { ids: [], names: [] }
    return {
      ipAddress: g.ip_address,
      signupCount: Number(g.signup_count),
      lastSignupAt: g.last_signup_at.toISOString(),
      userIds: bucket.ids,
      usernames: bucket.names,
    }
  })
}

export type WorkLikeRisk = {
  workId: string
  likeCount: number
  newAccountLikeCount: number
  newAccountRatio: number
  suspicious: boolean
}

const NEW_ACCOUNT_MS = 7 * 24 * 60 * 60 * 1000
const SUSPICIOUS_MIN_LIKES = 5
const SUSPICIOUS_RATIO = 0.5

/** 作品点赞中新账号（7 天内注册）占比 */
export async function getWorkLikeRiskByWorkIds(workIds: bigint[]): Promise<Map<string, WorkLikeRisk>> {
  const map = new Map<string, WorkLikeRisk>()
  if (workIds.length === 0) return map

  const since = new Date(Date.now() - NEW_ACCOUNT_MS)
  const rows = await prisma.$queryRaw<
    Array<{ work_id: bigint; total: bigint; new_accounts: bigint }>
  >`
    SELECT wl.work_id,
      COUNT(*)::bigint AS total,
      SUM(CASE WHEN u.created_at >= ${since} THEN 1 ELSE 0 END)::bigint AS new_accounts
    FROM work_like wl
    INNER JOIN sys_user u ON u.id = wl.user_id
    WHERE wl.work_id IN (${Prisma.join(workIds)})
    GROUP BY wl.work_id
  `

  for (const row of rows) {
    const likeCount = Number(row.total)
    const newAccountLikeCount = Number(row.new_accounts)
    const newAccountRatio = likeCount > 0 ? newAccountLikeCount / likeCount : 0
    const suspicious =
      likeCount >= SUSPICIOUS_MIN_LIKES && newAccountRatio >= SUSPICIOUS_RATIO
    map.set(row.work_id.toString(), {
      workId: row.work_id.toString(),
      likeCount,
      newAccountLikeCount,
      newAccountRatio,
      suspicious,
    })
  }
  return map
}
