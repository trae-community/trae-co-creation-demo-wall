/** 高危管理操作：阈值与原因字段校验（前后端共用） */

export const BATCH_BAN_CONFIRM_PHRASE = '确认封禁'

/** ≥ 此人数需在界面输入「确认封禁」 */
export const BATCH_BAN_TYPED_CONFIRM_MIN = 3

/** ≥ 此人数仅 root 可执行批量封禁 */
export const BATCH_BAN_ROOT_ONLY_MIN = 10

/** 批量审核 ≥ 此条数需在界面输入「确认审核」 */
export const BATCH_AUDIT_TYPED_CONFIRM_MIN = 5
export const BATCH_AUDIT_CONFIRM_PHRASE = '确认审核'

const DEFAULT_MAX_REASON = 500

export function parseOperationReason(
  raw: unknown,
  options?: { required?: boolean; minLength?: number; maxLength?: number }
): { ok: true; value: string } | { ok: false; error: string } {
  const required = options?.required ?? false
  const minLength = options?.minLength ?? (required ? 2 : 0)
  const maxLength = options?.maxLength ?? DEFAULT_MAX_REASON

  const value = typeof raw === 'string' ? raw.trim() : ''
  if (required && !value) {
    return { ok: false, error: '请填写操作原因' }
  }
  if (value && value.length < minLength) {
    return { ok: false, error: `操作原因至少 ${minLength} 个字符` }
  }
  if (value.length > maxLength) {
    return { ok: false, error: `操作原因不能超过 ${maxLength} 个字符` }
  }
  return { ok: true, value }
}

export function pickLogReason(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const reason =
    (typeof p.reason === 'string' && p.reason) ||
    (typeof p.auditReason === 'string' && p.auditReason) ||
    null
  return reason?.trim() || null
}
