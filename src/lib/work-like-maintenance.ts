import { prisma } from '@/lib/prisma'
import { getBannedUserIds } from '@/lib/ban'

export type BannedLikePurgePreview = {
  bannedUserCount: number
  likesFromBannedUsers: number
  affectedWorkCount: number
}

export type BannedLikePurgeResult = BannedLikePurgePreview & {
  deletedLikes: number
  recalculatedWorks: number
}

function parseBannedUserIds(ids: Set<string>): bigint[] {
  const out: bigint[] = []
  for (const id of ids) {
    try {
      out.push(BigInt(id))
    } catch {
      /* skip invalid dict entries */
    }
  }
  return out
}

/** 预览：封禁用户仍保留的点赞条数 */
export async function previewPurgeBannedUserLikes(): Promise<BannedLikePurgePreview> {
  const bannedIds = await getBannedUserIds()
  const userIds = parseBannedUserIds(bannedIds)

  if (userIds.length === 0) {
    return { bannedUserCount: 0, likesFromBannedUsers: 0, affectedWorkCount: 0 }
  }

  const likesFromBannedUsers = await prisma.workLike.count({
    where: { userId: { in: userIds } },
  })

  const affected = await prisma.workLike.findMany({
    where: { userId: { in: userIds } },
    select: { workId: true },
    distinct: ['workId'],
  })

  return {
    bannedUserCount: userIds.length,
    likesFromBannedUsers,
    affectedWorkCount: affected.length,
  }
}

/** 删除封禁用户的全部点赞，并按 work_like 重算 like_count */
export async function purgeBannedUserLikes(): Promise<BannedLikePurgeResult> {
  const preview = await previewPurgeBannedUserLikes()
  const bannedIds = await getBannedUserIds()
  const userIds = parseBannedUserIds(bannedIds)

  if (userIds.length === 0 || preview.likesFromBannedUsers === 0) {
    return { ...preview, deletedLikes: 0, recalculatedWorks: 0 }
  }

  return prisma.$transaction(async (tx) => {
    const affectedRows = await tx.workLike.findMany({
      where: { userId: { in: userIds } },
      select: { workId: true },
      distinct: ['workId'],
    })
    const workIds = affectedRows.map((r) => r.workId)

    const deleted = await tx.workLike.deleteMany({
      where: { userId: { in: userIds } },
    })

    let recalculatedWorks = 0
    for (const workId of workIds) {
      const count = await tx.workLike.count({ where: { workId } })
      await tx.workStatistic.upsert({
        where: { workId },
        update: { likeCount: count },
        create: { workId, viewCount: 0, likeCount: count },
      })
      recalculatedWorks += 1
    }

    return {
      ...preview,
      deletedLikes: deleted.count,
      recalculatedWorks,
    }
  })
}
