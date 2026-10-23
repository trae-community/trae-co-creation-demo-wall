/** 1024 代码盲盒活动开关（前端需 NEXT_PUBLIC_，构建时打入包内） */

export const CODE_BLIND_BOX_MAX_DRAWS = 2;

export function isCodeBlindBoxEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_CODE_BLIND_BOX_ENABLED ??
    process.env.CODE_BLIND_BOX_ENABLED;
  return flag === 'true' || flag === '1';
}
