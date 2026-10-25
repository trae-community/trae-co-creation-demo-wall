import { parseOperationReason } from '@/lib/admin-risk'

/** 审核拒绝（状态 2）必须填写原因；通过/待审可为空（由调用方填默认文案） */
export function resolveAuditReason(
  auditStatus: number,
  auditReason: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  const rejected = auditStatus === 2
  const parsed = parseOperationReason(auditReason, {
    required: rejected,
    minLength: rejected ? 2 : 0,
  })
  if (!parsed.ok) {
    return parsed
  }
  return { ok: true, value: parsed.value }
}
