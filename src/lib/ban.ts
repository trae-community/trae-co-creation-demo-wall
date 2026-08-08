import { prisma } from './prisma'

/**
 * 用户封禁与注册域名屏蔽（零表结构改动方案）
 *
 * 原理：复用系统字典表 sys_dict_item 作为黑名单存储
 * - banned_users          : itemValue = 用户 ID，封禁的用户
 * - blocked_email_domains : itemValue = 邮箱域名，禁止注册的域名
 *
 * 注意：黑名单带 60 秒内存缓存，封禁后最多 60 秒全量生效
 */

const BANNED_USERS_DICT = 'banned_users'
const BLOCKED_DOMAINS_DICT = 'blocked_email_domains'

/** 默认屏蔽的邮箱域名（字典未初始化时也生效） */
const DEFAULT_BLOCKED_DOMAINS = ['example.com', 'example.org', 'example.net']

const CACHE_TTL_MS = 60_000

let bannedCache: { ids: Set<string>; expireAt: number } | null = null
let domainsCache: { domains: Set<string>; expireAt: number } | null = null

/** 封禁/解封后立即失效缓存 */
export function clearBanCache() {
  bannedCache = null
  domainsCache = null
}

async function getDictItems(dictCode: string): Promise<string[]> {
  const items = await prisma.sysDictItem.findMany({
    where: { dictCode, status: true },
    select: { itemValue: true },
  })
  return items.map(item => item.itemValue)
}

/** 获取被封禁的用户 ID 集合（带缓存） */
export async function getBannedUserIds(): Promise<Set<string>> {
  if (bannedCache && Date.now() < bannedCache.expireAt) {
    return bannedCache.ids
  }
  try {
    const values = await getDictItems(BANNED_USERS_DICT)
    const ids = new Set(values)
    bannedCache = { ids, expireAt: Date.now() + CACHE_TTL_MS }
    return ids
  } catch (error) {
    console.error('[Ban] Failed to load banned users:', error)
    // 查询失败时沿用旧缓存，避免误放行
    return bannedCache?.ids ?? new Set()
  }
}

/** 判断用户是否被封禁 */
export async function isUserBanned(userId: bigint | number | string): Promise<boolean> {
  const ids = await getBannedUserIds()
  return ids.has(String(userId))
}

/** 确保字典存在（首次封禁时自动创建，无需重跑 seed） */
async function ensureDict(dictCode: string, dictName: string, description: string) {
  const existing = await prisma.sysDict.findUnique({
    where: { dictCode },
    select: { id: true },
  })
  if (!existing) {
    await prisma.sysDict.create({
      data: { dictCode, dictName, description, isSystem: true },
    })
  }
}

/** 封禁用户（黑名单条目 upsert） */
export async function banUser(userId: bigint | number | string, label: string) {
  await ensureDict(BANNED_USERS_DICT, '封禁用户黑名单', '被封禁的用户 ID 黑名单，封禁后无法登录')
  await prisma.sysDictItem.upsert({
    where: {
      dictCode_itemValue: { dictCode: BANNED_USERS_DICT, itemValue: String(userId) },
    },
    update: { itemLabel: label, status: true },
    create: {
      dictCode: BANNED_USERS_DICT,
      itemValue: String(userId),
      itemLabel: label,
      status: true,
    },
  })
  clearBanCache()
}

/** 解封用户 */
export async function unbanUser(userId: bigint | number | string) {
  await prisma.sysDictItem.deleteMany({
    where: { dictCode: BANNED_USERS_DICT, itemValue: String(userId) },
  })
  clearBanCache()
}

/** 判断邮箱域名是否被禁止注册 */
export async function isEmailDomainBlocked(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  if (!domain) return true

  if (!domainsCache || Date.now() >= domainsCache.expireAt) {
    let extra: string[] = []
    try {
      extra = await getDictItems(BLOCKED_DOMAINS_DICT)
    } catch (error) {
      console.error('[Ban] Failed to load blocked domains:', error)
    }
    domainsCache = {
      domains: new Set([
        ...DEFAULT_BLOCKED_DOMAINS,
        ...extra.map(d => d.toLowerCase()),
      ]),
      expireAt: Date.now() + CACHE_TTL_MS,
    }
  }

  return domainsCache.domains.has(domain)
}
