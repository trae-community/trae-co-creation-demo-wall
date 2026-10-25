import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** 每个作品最新一条含 reason 的审核记录（PostgreSQL DISTINCT ON） */
export async function getLatestAuditReasonsByWorkIds(
  workIds: bigint[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (workIds.length === 0) return map;

  const rows = await prisma.$queryRaw<
    Array<{ work_id: bigint; reason: string | null }>
  >`
    SELECT DISTINCT ON (work_id) work_id, reason
    FROM work_audit_log
    WHERE work_id IN (${Prisma.join(workIds)})
    ORDER BY work_id, created_at DESC
  `;

  for (const row of rows) {
    const reason = row.reason?.trim();
    if (reason) {
      map.set(row.work_id.toString(), reason);
    }
  }
  return map;
}
