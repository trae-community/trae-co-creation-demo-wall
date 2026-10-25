import { prisma } from '@/lib/prisma';

export type CityRankingAgg = {
  cityCode: string;
  approvedCount: number;
  totalViews: number;
  totalLikes: number;
};

export type CreatorRankingAgg = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  workCount: number;
  totalViews: number;
  totalLikes: number;
};

export async function getCityRankingAggregates(): Promise<CityRankingAgg[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      city_code: string;
      approved_count: bigint;
      total_views: bigint;
      total_likes: bigint;
    }>
  >`
    SELECT w.city_code AS city_code,
           COUNT(*)::bigint AS approved_count,
           COALESCE(SUM(s.view_count), 0)::bigint AS total_views,
           COALESCE(SUM(s.like_count), 0)::bigint AS total_likes
    FROM work_base w
    INNER JOIN work_statistic s ON s.work_id = w.id
    WHERE s.audit_status = 1 AND s.display_status = 1
      AND w.city_code IS NOT NULL
    GROUP BY w.city_code
  `;

  return rows.map((row) => ({
    cityCode: row.city_code,
    approvedCount: Number(row.approved_count),
    totalViews: Number(row.total_views),
    totalLikes: Number(row.total_likes),
  }));
}

export async function getCreatorRankingAggregates(): Promise<CreatorRankingAgg[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      user_id: bigint;
      username: string;
      avatar_url: string | null;
      work_count: bigint;
      total_views: bigint;
      total_likes: bigint;
    }>
  >`
    SELECT w.user_id AS user_id,
           u.username AS username,
           u.avatar_url AS avatar_url,
           COUNT(*)::bigint AS work_count,
           COALESCE(SUM(s.view_count), 0)::bigint AS total_views,
           COALESCE(SUM(s.like_count), 0)::bigint AS total_likes
    FROM work_base w
    INNER JOIN work_statistic s ON s.work_id = w.id
    INNER JOIN sys_user u ON u.id = w.user_id
    WHERE s.audit_status = 1 AND s.display_status = 1
    GROUP BY w.user_id, u.username, u.avatar_url
  `;

  return rows.map((row) => ({
    userId: row.user_id.toString(),
    username: row.username,
    avatarUrl: row.avatar_url,
    workCount: Number(row.work_count),
    totalViews: Number(row.total_views),
    totalLikes: Number(row.total_likes),
  }));
}
