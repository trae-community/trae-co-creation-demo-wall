/** 1024 代码盲盒活动开关（前端可见项需 NEXT_PUBLIC_ 前缀） */

export const CODE_BLIND_BOX_MAX_DRAWS = 2;

export function isCodeBlindBoxEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_CODE_BLIND_BOX_ENABLED ??
    process.env.CODE_BLIND_BOX_ENABLED;
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') {
    return !isPastEndDate();
  }
  if (process.env.NODE_ENV === 'development') return !isPastEndDate();
  return false;
}

/** 开发环境显示重置按钮，便于联调 */
export function isCodeBlindBoxDevTools(): boolean {
  return process.env.NODE_ENV === 'development';
}

function isPastEndDate(): boolean {
  const endAt = process.env.NEXT_PUBLIC_CODE_BLIND_BOX_END_AT;
  if (!endAt) return false;
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return false;
  return Date.now() > end.getTime();
}
