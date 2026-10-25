const DEFAULT_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 天
const DEFAULT_UPDATE_AGE_SEC = 24 * 60 * 60; // 1 天

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export function getAuthSessionOptions() {
  const maxAge = parsePositiveInt(process.env.AUTH_SESSION_MAX_AGE, DEFAULT_MAX_AGE_SEC);
  const updateAge = parsePositiveInt(process.env.AUTH_SESSION_UPDATE_AGE, DEFAULT_UPDATE_AGE_SEC);
  return {
    strategy: 'jwt' as const,
    maxAge,
    updateAge: Math.min(updateAge, maxAge),
  };
}

export function getPasswordSessionStamp(date: Date | null | undefined): number {
  return date ? date.getTime() : 0;
}
